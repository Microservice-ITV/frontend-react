import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import {
  FormField,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { leaveApi, leaveErrorMessage } from '../api/leaveApi'
import { useLeaveBalances, useLeavePolicies } from '../hooks/useLeaveData'
import {
  employeeLabel,
  formatDays,
  type LeaveBalance,
} from '../types/leaveTypes'

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2]

const LeaveBalancesPage = () => {
  const { openModal } = useGlobalModal()
  const [year, setYear] = useState<number>(currentYear)
  const [policyFilter, setPolicyFilter] = useState('')
  const { leavePolicies } = useLeavePolicies()
  const { leaveBalances, loading, error, reload } = useLeaveBalances({
    leave_year: year,
    leave_policy_id: policyFilter || undefined,
  })

  const openAdjust = (balance: LeaveBalance) => {
    const payload = {
      days: 1,
      reason: '',
    }

    openModal({
      title: 'Adjust leave balance',
      content: (
        <div className="grid gap-3">
          <p className="text-sm text-slate-500">
            {employeeLabel(balance.employee)} — {balance.leave_policy?.leave_type?.name ?? 'Leave'}{' '}
            ({balance.leave_year}). Available {formatDays(balance.available_days ?? 0)}.
          </p>
          <FormField label="Days (negative to deduct)" required>
            <input
              type="number"
              step="0.5"
              defaultValue={payload.days}
              onChange={(event) => {
                payload.days = Number(event.target.value)
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Reason">
            <textarea
              rows={3}
              onChange={(event) => {
                payload.reason = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
        </div>
      ),
      primaryLabel: 'Apply adjustment',
      primaryVariant: 'success',
      onPrimary: async () => {
        try {
          await leaveApi.adjustLeaveBalance(balance.id, {
            days: payload.days,
            reason: payload.reason || null,
          })
        } catch (err) {
          throw new Error(leaveErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<LeaveBalance>> = [
    {
      key: 'employee',
      header: 'Employee',
      sortValue: (row) => row.employee?.full_name ?? '',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.employee?.full_name ?? '—'}</p>
          <p className="text-xs text-slate-400">{row.employee?.employee_code ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'leave',
      header: 'Leave type',
      width: '160px',
      render: (row) => row.leave_policy?.leave_type?.name ?? row.leave_policy?.name ?? '—',
    },
    {
      key: 'entitled',
      header: 'Entitled',
      width: '100px',
      hideBelow: 'md',
      render: (row) => formatDays(row.entitled_days),
    },
    {
      key: 'used',
      header: 'Used',
      width: '100px',
      hideBelow: 'md',
      render: (row) => formatDays(row.used_days),
    },
    {
      key: 'pending',
      header: 'Pending',
      width: '100px',
      hideBelow: 'lg',
      render: (row) => formatDays(row.pending_days),
    },
    {
      key: 'available',
      header: 'Available',
      width: '120px',
      sortValue: (row) => Number(row.available_days ?? 0),
      render: (row) => (
        <span className="font-medium text-slate-900">{formatDays(row.available_days ?? 0)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) => (
        <RowActionMenu
          ariaLabel="Leave balance actions"
          items={[
            {
              key: 'adjust',
              label: 'Adjust balance',
              icon: <SlidersHorizontal size={16} className="shrink-0 text-slate-500" />,
              onClick: () => openAdjust(row),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Leave Balances</h1>
        <p className="text-sm text-slate-500">
          Review per-employee balances and post manual adjustments.
        </p>
      </div>

      <FilterBar
        selects={[
          {
            key: 'year',
            label: 'Leave year',
            value: String(year),
            onChange: (value) => setYear(Number(value)),
            options: YEAR_OPTIONS.map((option) => ({
              value: String(option),
              label: String(option),
            })),
          },
          {
            key: 'policy',
            label: 'Leave policy',
            value: policyFilter,
            allLabel: 'All policies',
            onChange: setPolicyFilter,
            options: leavePolicies.map((policy) => ({
              value: policy.id,
              label: policy.name,
            })),
          },
        ]}
      />

      <DataTable<LeaveBalance>
        columns={columns}
        rows={leaveBalances}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No leave balances found for this period."
        itemLabel="balances"
        minWidth="900px"
        fixedLayout
      />
    </div>
  )
}

export default LeaveBalancesPage
