import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { FormField, primaryButtonClass, textInputClass } from '@/features/employees/components/forms/FormField'
import { useEmployees } from '@/features/employees/hooks/useEmployeeData'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { useCan } from '@/app/rbac/hooks'
import { performanceApi, performanceErrorMessage } from '../api/performanceApi'
import { usePerformanceCycles, usePerformanceReviews } from '../hooks/usePerformanceData'
import { performancePaths, type PerformanceAreaRoot } from '../config/performancePaths'
import { PerformanceReviewStatusBadge } from '../components/PerformanceBadges'
import {
  PERFORMANCE_REVIEW_STATUSES,
  PERFORMANCE_REVIEW_STATUS_LABELS,
  employeeLabel,
  formatScore,
  type PerformanceReview,
} from '../types/performanceTypes'

const PerformanceReviewsPage = ({ root }: { root: PerformanceAreaRoot }) => {
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const paths = performancePaths(root)
  const canManage = useCan(CAPABILITIES.PERFORMANCE_MANAGE)

  const [statusFilter, setStatusFilter] = useState('')
  const [cycleFilter, setCycleFilter] = useState('')

  const { employees } = useEmployees()
  const { performanceCycles } = usePerformanceCycles()
  const { performanceReviews, loading, error, reload } = usePerformanceReviews({
    status: statusFilter || undefined,
    performance_cycle_id: cycleFilter || undefined,
  })

  const openCreate = () => {
    const payload = {
      employee_id: employees[0]?.id ?? '',
      performance_cycle_id: performanceCycles.find((cycle) => cycle.status !== 'CLOSED')?.id ?? '',
    }

    openModal({
      title: 'Create performance review',
      content: (
        <div className="grid gap-3">
          <FormField label="Employee" required>
            <select
              defaultValue={payload.employee_id}
              onChange={(event) => {
                payload.employee_id = event.target.value
              }}
              className={textInputClass}
            >
              <option value="">Select an employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employeeLabel(employee)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Performance cycle" required hint="The cycle KPI assignments seed the scorecard.">
            <select
              defaultValue={payload.performance_cycle_id}
              onChange={(event) => {
                payload.performance_cycle_id = event.target.value
              }}
              className={textInputClass}
            >
              <option value="">Select a cycle</option>
              {performanceCycles
                .filter((cycle) => cycle.status !== 'CLOSED')
                .map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </option>
                ))}
            </select>
          </FormField>
        </div>
      ),
      primaryLabel: 'Create review',
      onPrimary: async () => {
        if (!payload.employee_id) throw new Error('Select an employee')
        if (!payload.performance_cycle_id) throw new Error('Select a performance cycle')
        try {
          const response = await performanceApi.createReview(payload)
          const created = response.data.data.performance_review
          await reload()
          navigate(paths.reviewDetail(created.id))
        } catch (err) {
          throw new Error(performanceErrorMessage(err))
        }
      },
    })
  }

  const columns: Array<DataTableColumn<PerformanceReview>> = [
    {
      key: 'employee',
      header: 'Employee',
      sortValue: (row) => employeeLabel(row.employee),
      render: (row) => <span className="font-medium text-slate-900">{employeeLabel(row.employee)}</span>,
    },
    {
      key: 'cycle',
      header: 'Cycle',
      hideBelow: 'md',
      sortValue: (row) => row.performance_cycle?.name ?? '',
      render: (row) => <span className="text-sm text-slate-600">{row.performance_cycle?.name ?? '—'}</span>,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Performance reviews</h1>
          <p className="text-sm text-slate-500">Weighted KPI scorecards through the review lifecycle.</p>
        </div>
        {canManage && (
          <button type="button" className={primaryButtonClass} onClick={openCreate}>
            <Plus size={16} /> New review
          </button>
        )}
      </div>

      <FilterBar
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            allLabel: 'All statuses',
            options: PERFORMANCE_REVIEW_STATUSES.map((status) => ({
              value: status,
              label: PERFORMANCE_REVIEW_STATUS_LABELS[status],
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

      <DataTable<PerformanceReview>
        columns={columns}
        rows={performanceReviews}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No performance reviews yet."
        itemLabel="review"
        onRowClick={(row) => navigate(paths.reviewDetail(row.id))}
      />
    </div>
  )
}

export default PerformanceReviewsPage
