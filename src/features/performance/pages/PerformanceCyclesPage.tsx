import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, Eye, Play, Plus, XCircle } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import {
  FormField,
  primaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { useEmployeeStyleForm } from '@/features/employees/components/forms/useEmployeeStyleForm'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { useCan } from '@/app/rbac/hooks'
import { performanceApi, performanceErrorMessage } from '../api/performanceApi'
import { usePerformanceCycles } from '../hooks/usePerformanceData'
import { performancePaths, type PerformanceAreaRoot } from '../config/performancePaths'
import {
  PerformanceCycleStatusBadge,
  PerformancePeriodTypeBadge,
} from '../components/PerformanceBadges'
import {
  PERFORMANCE_CYCLE_STATUSES,
  PERFORMANCE_CYCLE_STATUS_LABELS,
  PERFORMANCE_PERIOD_TYPES,
  PERFORMANCE_PERIOD_TYPE_LABELS,
  formatDate,
  type PerformanceCycle,
  type PerformanceCyclePayload,
  type PerformancePeriodType,
} from '../types/performanceTypes'

const PerformanceCyclesPage = ({ root }: { root: PerformanceAreaRoot }) => {
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const paths = performancePaths(root)
  const canManage = useCan(CAPABILITIES.PERFORMANCE_MANAGE)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')

  const { performanceCycles, loading, error, reload } = usePerformanceCycles({
    search: search || undefined,
    status: statusFilter || undefined,
    period_type: periodFilter || undefined,
  })

  const openCreate = () => {
    const payload: PerformanceCyclePayload = {
      name: '',
      period_type: 'QUARTERLY',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: '',
    }

    showForm({
      title: 'New performance cycle',
      content: (
        <div className="grid gap-3">
          <FormField label="Name" required>
            <input
              type="text"
              placeholder="e.g. Q1 2026 Performance"
              defaultValue={payload.name}
              onChange={(event) => {
                payload.name = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Period type" required>
            <select
              defaultValue={payload.period_type}
              onChange={(event) => {
                payload.period_type = event.target.value as PerformancePeriodType
              }}
              className={textInputClass}
            >
              {PERFORMANCE_PERIOD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PERFORMANCE_PERIOD_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Start date" required>
              <input
                type="date"
                defaultValue={payload.start_date}
                onChange={(event) => {
                  payload.start_date = event.target.value
                }}
                className={textInputClass}
              />
            </FormField>
            <FormField label="End date" required>
              <input
                type="date"
                defaultValue={payload.end_date}
                onChange={(event) => {
                  payload.end_date = event.target.value
                }}
                className={textInputClass}
              />
            </FormField>
          </div>
        </div>
      ),
      primaryLabel: 'Create cycle',
      onPrimary: async () => {
        if (!payload.name.trim()) throw new Error('Name is required')
        if (!payload.start_date) throw new Error('Start date is required')
        if (!payload.end_date) throw new Error('End date is required')
        if (payload.end_date < payload.start_date) {
          throw new Error('End date must be on or after the start date')
        }
        try {
          const response = await performanceApi.createCycle(payload)
          const created = response.data.data.performance_cycle
          await reload()
          navigate(paths.cycleDetail(created.id))
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
      },
    })
  }

  const cycleAction = (cycle: PerformanceCycle, action: 'activate' | 'close' | 'propose') => {
    if (action === 'propose') {
      openModal({
        title: 'Propose bonuses for this cycle',
        content: (
          <p className="text-sm text-slate-600">
            Evaluate every finalized review in <span className="font-medium">{cycle.name}</span> against the active
            bonus policies and create proposed awards where a policy applies.
          </p>
        ),
        primaryLabel: 'Propose bonuses',
        onPrimary: async () => {
          try {
            const response = await performanceApi.proposeBonusesForCycle(cycle.id)
            const count = response.data.data.count
            await reload()
            if (count === 0) {
              openModal({
                title: 'No bonuses proposed',
                content: (
                  <p className="text-sm text-slate-600">
                    No finalized reviews matched an active bonus policy for this cycle.
                  </p>
                ),
                hidePrimary: true,
              })
            }
          } catch (err) {
            throw new Error(performanceErrorMessage(err))
          }
        },
      })
      return
    }

    openModal({
      title: action === 'activate' ? 'Activate performance cycle' : 'Close performance cycle',
      content: (
        <p className="text-sm text-slate-600">
          {action === 'activate'
            ? `Activate "${cycle.name}" so reviews can be created and scored?`
            : `Close "${cycle.name}"? No further reviews or score changes will be allowed.`}
        </p>
      ),
      primaryLabel: action === 'activate' ? 'Activate' : 'Close',
      primaryVariant: action === 'activate' ? 'success' : 'danger',
      onPrimary: async () => {
        try {
          if (action === 'activate') await performanceApi.activateCycle(cycle.id)
          else await performanceApi.closeCycle(cycle.id)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const availableActions = (cycle: PerformanceCycle) => {
    const items: Array<{ key: string; label: string; icon: React.ReactNode; onClick: () => void }> = [
      {
        key: 'view',
        label: 'View',
        icon: <Eye size={14} />,
        onClick: () => navigate(paths.cycleDetail(cycle.id)),
      },
    ]
    if (!canManage) return items
    if (cycle.status === 'DRAFT') {
      items.push({ key: 'activate', label: 'Activate', icon: <Play size={14} />, onClick: () => cycleAction(cycle, 'activate') })
    }
    if (cycle.status === 'ACTIVE' || cycle.status === 'UNDER_REVIEW') {
      items.push({ key: 'close', label: 'Close', icon: <XCircle size={14} />, onClick: () => cycleAction(cycle, 'close') })
    }
    if (cycle.status === 'UNDER_REVIEW' || cycle.status === 'CLOSED') {
      items.push({
        key: 'propose',
        label: 'Propose bonuses',
        icon: <CalendarCheck size={14} />,
        onClick: () => cycleAction(cycle, 'propose'),
      })
    }
    return items
  }

  const columns: Array<DataTableColumn<PerformanceCycle>> = [
    {
      key: 'name',
      header: 'Cycle',
      sortValue: (row) => row.name,
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      key: 'period_type',
      header: 'Period',
      width: '120px',
      sortValue: (row) => row.period_type,
      render: (row) => <PerformancePeriodTypeBadge periodType={row.period_type} />,
    },
    {
      key: 'dates',
      header: 'Dates',
      hideBelow: 'md',
      sortValue: (row) => row.start_date,
      render: (row) => (
        <span className="text-sm text-slate-600">
          {formatDate(row.start_date)} – {formatDate(row.end_date)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      sortValue: (row) => row.status,
      render: (row) => <PerformanceCycleStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      align: 'right',
      render: (row) => <RowActionMenu items={availableActions(row)} ariaLabel={`Actions for ${row.name}`} />,
    },
  ]

  if (formPage) return formPage

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Performance cycles</h1>
          <p className="text-sm text-slate-500">Define review periods, attach weighted KPIs and run evaluations.</p>
        </div>
        {canManage && (
          <button type="button" className={primaryButtonClass} onClick={openCreate}>
            <Plus size={16} /> New cycle
          </button>
        )}
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Search cycles…' }}
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            allLabel: 'All statuses',
            options: PERFORMANCE_CYCLE_STATUSES.map((status) => ({
              value: status,
              label: PERFORMANCE_CYCLE_STATUS_LABELS[status],
            })),
          },
          {
            key: 'period',
            label: 'Period type',
            value: periodFilter,
            onChange: setPeriodFilter,
            allLabel: 'All periods',
            options: PERFORMANCE_PERIOD_TYPES.map((type) => ({
              value: type,
              label: PERFORMANCE_PERIOD_TYPE_LABELS[type],
            })),
          },
        ]}
      />

      <DataTable<PerformanceCycle>
        columns={columns}
        rows={performanceCycles}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No performance cycles yet."
        itemLabel="cycle"
        onRowClick={(row) => navigate(paths.cycleDetail(row.id))}
      />
    </div>
  )
}

export default PerformanceCyclesPage
