import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Send, Upload } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import { FormField, textInputClass } from '@/features/employees/components/forms/FormField'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { useCan } from '@/app/rbac/hooks'
import { payrollApi } from '@/features/payroll/api/payrollApi'
import {
  PAYROLL_RUN_EDITABLE_STATUSES,
  PAYROLL_RUN_STATUS_LABELS,
  type PayrollRun,
} from '@/features/payroll/types/payrollTypes'
import { performanceApi, performanceErrorMessage } from '../api/performanceApi'
import { useBonusAwards, usePerformanceCycles } from '../hooks/usePerformanceData'
import { performancePaths, type PerformanceAreaRoot } from '../config/performancePaths'
import { BonusAwardStatusBadge } from '../components/PerformanceBadges'
import {
  BONUS_AWARD_STATUSES,
  BONUS_AWARD_STATUS_LABELS,
  employeeLabel,
  formatMoney,
  type BonusAward,
} from '../types/performanceTypes'

const BonusAwardsPage = ({ root }: { root: PerformanceAreaRoot }) => {
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const paths = performancePaths(root)

  const canApprove = useCan(CAPABILITIES.BONUS_APPROVE)
  const canManage = useCan(CAPABILITIES.BONUS_POLICIES_MANAGE)

  const [statusFilter, setStatusFilter] = useState('')
  const [cycleFilter, setCycleFilter] = useState('')

  const { performanceCycles } = usePerformanceCycles()
  const { bonusAwards, loading, error, reload } = useBonusAwards({
    status: statusFilter || undefined,
    performance_cycle_id: cycleFilter || undefined,
  })

  const approveAward = (award: BonusAward) => {
    let amount = Number(award.proposed_amount)
    openModal({
      title: 'Approve bonus award',
      content: (
        <FormField label="Approved amount" required hint={`Proposed: ${formatMoney(award.proposed_amount)}`}>
          <input
            type="number"
            min={0.01}
            step="0.01"
            defaultValue={amount}
            onChange={(event) => {
              amount = Number(event.target.value)
            }}
            className={textInputClass}
          />
        </FormField>
      ),
      primaryLabel: 'Approve',
      onPrimary: async () => {
        if (!amount || amount <= 0) throw new Error('Approved amount must be greater than zero')
        try {
          await performanceApi.approveBonusAward(award.id, amount)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const rejectAward = (award: BonusAward) => {
    openModal({
      title: 'Reject bonus award',
      content: <p className="text-sm text-slate-600">Reject the proposed bonus for {employeeLabel(award.employee)}?</p>,
      primaryLabel: 'Reject',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await performanceApi.rejectBonusAward(award.id)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const syncAward = async (award: BonusAward) => {
    let runId = ''
    let runs: PayrollRun[] = []
    try {
      const response = await payrollApi.listRuns({ per_page: 100 })
      runs = response.data.data.payroll_runs.data.filter((run) =>
        PAYROLL_RUN_EDITABLE_STATUSES.includes(run.status),
      )
    } catch (err) {
      throw new Error(performanceErrorMessage(err))
    }
    openModal({
      title: 'Sync bonus to payroll',
      content: (
        <FormField
          label="Payroll run"
          required
          hint="The run must be in Draft, Calculated or Under review."
        >
          <select
            onChange={(event) => {
              runId = event.target.value
            }}
            className={textInputClass}
          >
            <option value="">Select a payroll run…</option>
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {run.reference} · {PAYROLL_RUN_STATUS_LABELS[run.status]}
              </option>
            ))}
          </select>
        </FormField>
      ),
      primaryLabel: 'Sync to payroll',
      onPrimary: async () => {
        if (!runId) throw new Error('Select a payroll run')
        try {
          await performanceApi.syncBonusAwardToPayroll(award.id, runId)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const availableActions = (award: BonusAward) => {
    const items: Array<{ key: string; label: string; icon: React.ReactNode; className?: string; onClick: () => void }> = []
    if (award.status === 'PROPOSED' && canApprove) {
      items.push({ key: 'approve', label: 'Approve', icon: <CheckCircle2 size={14} />, onClick: () => approveAward(award) })
      items.push({ key: 'reject', label: 'Reject', icon: <Send size={14} />, className: 'text-rose-600', onClick: () => rejectAward(award) })
    }
    if (award.status === 'APPROVED' && canApprove) {
      items.push({ key: 'sync', label: 'Sync to payroll', icon: <Upload size={14} />, onClick: () => syncAward(award) })
    }
    return items
  }

  const columns: Array<DataTableColumn<BonusAward>> = [
    {
      key: 'employee',
      header: 'Employee',
      sortValue: (row) => employeeLabel(row.employee),
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{employeeLabel(row.employee)}</p>
          <p className="text-xs text-slate-500">Policy: {row.bonus_policy?.name ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'proposed',
      header: 'Proposed',
      width: '120px',
      align: 'right',
      sortValue: (row) => Number(row.proposed_amount),
      render: (row) => <span className="text-sm text-slate-600">{formatMoney(row.proposed_amount)}</span>,
    },
    {
      key: 'approved',
      header: 'Approved',
      width: '120px',
      align: 'right',
      sortValue: (row) => Number(row.approved_amount ?? -1),
      render: (row) => (
        <span className="text-sm font-medium text-slate-900">
          {row.approved_amount === null || row.approved_amount === undefined ? '—' : formatMoney(row.approved_amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '160px',
      sortValue: (row) => row.status,
      render: (row) => <BonusAwardStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      render: (row) => {
        const items = availableActions(row)
        return items.length > 0 ? <RowActionMenu items={items} ariaLabel="Bonus award actions" /> : null
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Bonus awards</h1>
          <p className="text-sm text-slate-500">
            Proposed from finalized reviews, approved by HR, then settled through payroll.
          </p>
        </div>
      </div>

      <FilterBar
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            allLabel: 'All statuses',
            options: BONUS_AWARD_STATUSES.map((status) => ({
              value: status,
              label: BONUS_AWARD_STATUS_LABELS[status],
            })),
          },
          {
            key: 'cycle',
            label: 'Cycle',
            value: cycleFilter,
            onChange: setCycleFilter,
            allLabel: 'All cycles',
            options: performanceCycles.map((cycle) => ({ value: cycle.id, label: cycle.name })),
          },
        ]}
      />

      <DataTable<BonusAward>
        columns={columns}
        rows={bonusAwards}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No bonus awards yet."
        itemLabel="award"
        onRowClick={(row) => navigate(paths.reviewDetail(row.performance_review_id))}
      />
    </div>
  )
}

export default BonusAwardsPage
