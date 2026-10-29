import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Play, Target, XCircle } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import StatCard from '@/components/ui/StatCard'
import {
  FormField,
  primaryButtonClass,
  secondaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { useCan } from '@/app/rbac/hooks'
import { performanceApi, performanceErrorMessage } from '../api/performanceApi'
import { useKpis, usePerformanceCycle, usePerformanceReviews } from '../hooks/usePerformanceData'
import { performancePaths, type PerformanceAreaRoot } from '../config/performancePaths'
import {
  PerformanceCycleStatusBadge,
  PerformancePeriodTypeBadge,
  PerformanceReviewStatusBadge,
} from '../components/PerformanceBadges'
import {
  formatScore,
  formatWeight,
  employeeLabel,
  type PerformanceCycleKpi,
  type PerformanceReview,
} from '../types/performanceTypes'

const PerformanceCycleDetailPage = ({ root }: { root: PerformanceAreaRoot }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const paths = performancePaths(root)
  const canManage = useCan(CAPABILITIES.PERFORMANCE_MANAGE)

  const [refreshing, setRefreshing] = useState(false)
  const { performanceCycle, loading, error, reload } = usePerformanceCycle(id)
  const { kpis } = useKpis()
  const { performanceReviews, reload: reloadReviews } = usePerformanceReviews({
    performance_cycle_id: id,
  })

  const cycle = performanceCycle
  const cycleKpis = cycle?.cycle_kpis ?? []

  const refresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([reload(), reloadReviews()])
    } finally {
      setRefreshing(false)
    }
  }

  const openAssignKpis = () => {
    const rows = kpis.map((kpi) => {
      const assignment = cycleKpis.find((candidate) => candidate.kpi_id === kpi.id)
      return {
        included: Boolean(assignment),
        kpi_id: kpi.id,
        target_value:
          assignment?.target_value === null || assignment?.target_value === undefined
            ? null
            : Number(assignment.target_value),
        weight_percentage: assignment ? Number(assignment.weight_percentage) : 0,
      }
    })

    openModal({
      title: 'Assign KPIs to cycle',
      size: 'lg',
      content: (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Include the KPIs evaluated in this cycle. Weights must sum to 100%.
          </p>
          {rows.map((row, index) => {
            const kpi = kpis[index]
            return (
              <div key={row.kpi_id} className="grid grid-cols-12 items-end gap-2 rounded-lg border border-slate-200 p-2">
                <label className="col-span-12 flex items-center gap-2 sm:col-span-5">
                  <input
                    type="checkbox"
                    defaultChecked={row.included}
                    onChange={(event) => {
                      row.included = event.target.checked
                    }}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-800">{kpi.title}</span>
                </label>
                <div className="col-span-6 sm:col-span-3">
                  <FormField label={index === 0 ? 'Target value' : ''}>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={row.target_value ?? ''}
                      onChange={(event) => {
                        row.target_value = event.target.value === '' ? null : Number(event.target.value)
                      }}
                      className={textInputClass}
                    />
                  </FormField>
                </div>
                <div className="col-span-6 sm:col-span-4">
                  <FormField label={index === 0 ? 'Weight %' : ''}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      defaultValue={row.weight_percentage || ''}
                      onChange={(event) => {
                        row.weight_percentage = Number(event.target.value)
                      }}
                      className={textInputClass}
                    />
                  </FormField>
                </div>
              </div>
            )
          })}
        </div>
      ),
      primaryLabel: 'Save KPIs',
      onPrimary: async () => {
        const filled = rows.filter((row) => row.included)
        if (filled.length === 0) throw new Error('Include at least one KPI')
        const totalWeight = filled.reduce((sum, row) => sum + (row.weight_percentage || 0), 0)
        if (Math.abs(totalWeight - 100) > 0.01) {
          throw new Error(`Weights must sum to 100% (currently ${totalWeight})`)
        }
        try {
          await performanceApi.setCycleKpis(
            id!,
            filled.map((row) => ({
              kpi_id: row.kpi_id,
              position_id: null,
              target_value: row.target_value,
              weight_percentage: row.weight_percentage,
            })),
          )
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  const cycleAction = (action: 'activate' | 'close' | 'propose') => {
    if (action === 'propose') {
      openModal({
        title: 'Propose bonuses for this cycle',
        content: (
          <p className="text-sm text-slate-600">
            Evaluate every finalized review against active bonus policies and create proposed awards.
          </p>
        ),
        primaryLabel: 'Propose bonuses',
        onPrimary: async () => {
          try {
            await performanceApi.proposeBonusesForCycle(id!)
          } catch (err) {
            throw new Error(performanceErrorMessage(err))
          }
          await refresh()
        },
      })
      return
    }
    openModal({
      title: action === 'activate' ? 'Activate performance cycle' : 'Close performance cycle',
      content: (
        <p className="text-sm text-slate-600">
          {action === 'activate'
            ? 'Activate this cycle so reviews can be created and scored?'
            : 'Close this cycle? No further reviews or score changes will be allowed.'}
        </p>
      ),
      primaryLabel: action === 'activate' ? 'Activate' : 'Close',
      primaryVariant: action === 'activate' ? 'success' : 'danger',
      onPrimary: async () => {
        try {
          if (action === 'activate') await performanceApi.activateCycle(id!)
          else await performanceApi.closeCycle(id!)
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  const reviewColumns: Array<DataTableColumn<PerformanceReview>> = [
    {
      key: 'employee',
      header: 'Employee',
      sortValue: (row) => employeeLabel(row.employee),
      render: (row) => <span className="font-medium text-slate-900">{employeeLabel(row.employee)}</span>,
    },
    {
      key: 'score',
      header: 'Weighted score',
      width: '130px',
      align: 'right',
      sortValue: (row) => Number(row.overall_weighted_score ?? -1),
      render: (row) => <span className="font-medium text-slate-900">{formatScore(row.overall_weighted_score)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '150px',
      sortValue: (row) => row.status,
      render: (row) => <PerformanceReviewStatusBadge status={row.status} />,
    },
  ]

  const totalWeight = cycleKpis.reduce((sum, assignment) => sum + Number(assignment.weight_percentage ?? 0), 0)

  if (loading && !cycle) return <p className="text-sm text-slate-500">Loading performance cycle…</p>

  if (error) {
    return (
      <div className="space-y-3">
        <Link to={paths.cycles} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={14} /> Back to cycles
        </Link>
        <p className="text-sm text-rose-600">{error}</p>
      </div>
    )
  }

  if (!cycle) return null

  const actionButtons: Array<{ key: string; label: string; icon: React.ReactNode; className: string; onClick: () => void }> = []
  if (canManage) {
    if (cycle.status === 'DRAFT') {
      actionButtons.push({
        key: 'assign',
        label: 'Assign KPIs',
        icon: <Target size={16} />,
        className: secondaryButtonClass,
        onClick: openAssignKpis,
      })
      actionButtons.push({
        key: 'activate',
        label: 'Activate',
        icon: <Play size={16} />,
        className: primaryButtonClass,
        onClick: () => cycleAction('activate'),
      })
    }
    if (cycle.status === 'ACTIVE' || cycle.status === 'UNDER_REVIEW') {
      actionButtons.push({
        key: 'assign',
        label: 'Assign KPIs',
        icon: <Target size={16} />,
        className: secondaryButtonClass,
        onClick: openAssignKpis,
      })
      actionButtons.push({
        key: 'close',
        label: 'Close cycle',
        icon: <XCircle size={16} />,
        className: secondaryButtonClass,
        onClick: () => cycleAction('close'),
      })
    }
    if (cycle.status === 'UNDER_REVIEW' || cycle.status === 'CLOSED') {
      actionButtons.push({
        key: 'propose',
        label: 'Propose bonuses',
        icon: <Target size={16} />,
        className: primaryButtonClass,
        onClick: () => cycleAction('propose'),
      })
    }
  }

  return (
    <div className="space-y-5">
      <Link to={paths.cycles} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={14} /> Back to cycles
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-900">{cycle.name}</h1>
        <PerformanceCycleStatusBadge status={cycle.status} size="md" />
        <PerformancePeriodTypeBadge periodType={cycle.period_type} size="md" />
      </div>
      <p className="text-sm text-slate-500">
        {new Date(cycle.start_date).toLocaleDateString()} – {new Date(cycle.end_date).toLocaleDateString()}
      </p>

      {actionButtons.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-busy={refreshing}>
          {actionButtons.map((button) => (
            <button
              key={button.key}
              type="button"
              className={button.className}
              onClick={button.onClick}
              disabled={refreshing}
            >
              {button.icon} {button.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard title="Assigned KPIs" value={cycleKpis.length} icon={Target} tone="brand" />
        <StatCard title="Total weight" value={`${formatWeight(totalWeight)}`} icon={Target} tone="info" />
        <StatCard title="Reviews" value={performanceReviews.length} icon={Target} tone="neutral" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Cycle KPIs</h2>
        </div>
        <DataTable<PerformanceCycleKpi>
          columns={[
            {
              key: 'kpi',
              header: 'KPI',
              render: (row) => <span className="font-medium text-slate-900">{row.kpi?.title ?? row.kpi_id}</span>,
            },
            {
              key: 'target',
              header: 'Target',
              width: '110px',
              align: 'right',
              render: (row) => <span className="text-sm text-slate-600">{row.target_value ?? '—'}</span>,
            },
            {
              key: 'weight',
              header: 'Weight',
              width: '100px',
              align: 'right',
              render: (row) => <span className="text-sm font-medium text-slate-900">{formatWeight(row.weight_percentage)}</span>,
            },
            {
              key: 'position',
              header: 'Position scope',
              hideBelow: 'md',
              render: (row) => <span className="text-sm text-slate-600">{row.position?.title ?? 'All positions'}</span>,
            },
          ]}
          rows={cycleKpis}
          rowKey={(row) => row.id}
          emptyMessage="No KPIs assigned to this cycle yet."
          itemLabel="KPI"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Reviews in this cycle</h2>
        </div>
        <DataTable<PerformanceReview>
          columns={reviewColumns}
          rows={performanceReviews}
          rowKey={(row) => row.id}
          emptyMessage="No reviews created for this cycle yet."
          itemLabel="review"
          onRowClick={(row) => navigate(paths.reviewDetail(row.id))}
        />
      </section>
    </div>
  )
}

export default PerformanceCycleDetailPage
