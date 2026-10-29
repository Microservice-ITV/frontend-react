import { useState } from 'react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useMyBonusAwards, useMyEmployeeGoals, useMyPerformanceReviews } from '../hooks/usePerformanceData'
import { PerformanceReviewStatusBadge, BonusAwardStatusBadge, EmployeeGoalStatusBadge } from '../components/PerformanceBadges'
import { employeeLabel, formatMoney, formatScore, formatDate } from '../types/performanceTypes'
import type { PerformanceReview, BonusAward, EmployeeGoal } from '../types/performanceTypes'

const MyPerformancePage = () => {
  const [goalStatus, setGoalStatus] = useState('')
  const { performanceReviews, loading: reviewsLoading, error: reviewsError } = useMyPerformanceReviews()
  const { bonusAwards, loading: awardsLoading, error: awardsError } = useMyBonusAwards()
  const { employeeGoals, loading: goalsLoading, error: goalsError } = useMyEmployeeGoals({
    status: goalStatus || undefined,
  })

  const reviewColumns: Array<DataTableColumn<PerformanceReview>> = [
    {
      key: 'cycle',
      header: 'Cycle',
      render: (row) => <span className="font-medium text-slate-900">{row.performance_cycle?.name ?? '—'}</span>,
    },
    {
      key: 'dates',
      header: 'Dates',
      hideBelow: 'md',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {formatDate(row.performance_cycle?.start_date)} – {formatDate(row.performance_cycle?.end_date)}
        </span>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      width: '100px',
      align: 'right',
      render: (row) => <span className="font-medium text-slate-900">{formatScore(row.overall_weighted_score)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '150px',
      render: (row) => <PerformanceReviewStatusBadge status={row.status} />,
    },
  ]

  const awardColumns: Array<DataTableColumn<BonusAward>> = [
    {
      key: 'cycle',
      header: 'Cycle',
      render: (row) => <span className="text-sm text-slate-900">{row.performance_review?.performance_cycle?.name ?? '—'}</span>,
    },
    {
      key: 'proposed',
      header: 'Proposed',
      width: '110px',
      align: 'right',
      render: (row) => <span className="text-sm text-slate-600">{formatMoney(row.proposed_amount)}</span>,
    },
    {
      key: 'approved',
      header: 'Approved',
      width: '110px',
      align: 'right',
      render: (row) => <span className="text-sm font-medium text-slate-900">{formatMoney(row.approved_amount ?? row.proposed_amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '150px',
      render: (row) => <BonusAwardStatusBadge status={row.status} />,
    },
  ]

  const goalColumns: Array<DataTableColumn<EmployeeGoal>> = [
    {
      key: 'title',
      header: 'Goal',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.title}</p>
          <p className="text-xs text-slate-500">Cycle: {row.performance_cycle?.name ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      width: '120px',
      align: 'right',
      render: (row) => <span className="text-sm text-slate-600">{row.progress_percentage ?? 0}%</span>,
    },
    {
      key: 'due',
      header: 'Due',
      width: '120px',
      render: (row) => <span className="text-sm text-slate-600">{formatDate(row.due_date)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (row) => <EmployeeGoalStatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My performance</h1>
        <p className="text-sm text-slate-500">View your reviews, goals and bonus awards in one place.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Performance reviews</h2>
        </div>
        <DataTable<PerformanceReview>
          columns={reviewColumns}
          rows={performanceReviews}
          rowKey={(row) => row.id}
          loading={reviewsLoading}
          error={reviewsError}
          emptyMessage="No performance reviews assigned to you yet."
          itemLabel="review"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Bonus awards</h2>
        </div>
        <DataTable<BonusAward>
          columns={awardColumns}
          rows={bonusAwards}
          rowKey={(row) => row.id}
          loading={awardsLoading}
          error={awardsError}
          emptyMessage="No bonus awards recorded for you yet."
          itemLabel="award"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Goals</h2>
          <FilterBar
            selects={[
              {
                key: 'status',
                label: 'Status',
                value: goalStatus,
                onChange: setGoalStatus,
                allLabel: 'All',
                options: [
                  { value: 'NOT_STARTED', label: 'Not started' },
                  { value: 'IN_PROGRESS', label: 'In progress' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'MISSED', label: 'Missed' },
                ],
              },
            ]}
          />
        </div>
        <DataTable<EmployeeGoal>
          columns={goalColumns}
          rows={employeeGoals}
          rowKey={(row) => row.id}
          loading={goalsLoading}
          error={goalsError}
          emptyMessage="No goals assigned to you yet."
          itemLabel="goal"
        />
      </section>
    </div>
  )
}

export default MyPerformancePage
