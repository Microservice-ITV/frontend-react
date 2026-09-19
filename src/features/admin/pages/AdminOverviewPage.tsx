import { useEffect } from 'react'
import { Building2, Users, AlertTriangle, UserRound } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import StatCard from '@/features/dashboard/components/widgets/StatCard'
import OverviewChart, {
  type OverviewChartRow,
} from '@/features/dashboard/components/widgets/OverviewChart'
import TrafficSourcesChart from '@/features/dashboard/components/widgets/TrafficSourcesChart'
import MonthlyGoalsCard from '@/features/dashboard/components/widgets/MonthlyGoalsCard'
import { fetchAdminDashboardMetrics } from '../store/adminDashboardThunks'
import {
  selectAdminDashboardError,
  selectAdminDashboardMetrics,
  selectAdminDashboardStatus,
} from '../store/adminDashboardSelectors'

const AdminOverviewPage = () => {
  const dispatch = useAppDispatch()
  const metrics = useAppSelector(selectAdminDashboardMetrics)
  const status = useAppSelector(selectAdminDashboardStatus)
  const error = useAppSelector(selectAdminDashboardError)

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchAdminDashboardMetrics())
    }
  }, [dispatch, status])

  const displayValue = (value: number | undefined) =>
    status === 'loading' ? '...' : value?.toLocaleString() ?? '—'

  const chartData: OverviewChartRow[] = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), index, 1)
    const monthKey = `${date.getFullYear()}-${String(index + 1).padStart(2, '0')}`
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })
    return {
      month: monthLabel,
      users: metrics?.monthlyUsers.find((item) => item.month === monthKey)?.count ?? 0,
      shops: metrics?.monthlyShops.find((item) => item.month === monthKey)?.count ?? 0,
      pending:
        metrics?.monthlyPendingShops.find((item) => item.month === monthKey)?.count ?? 0,
    }
  })

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Dashboard</h2>
        <p className="mt-0.5 text-xs text-slate-600">
          Welcome back. Here&apos;s what&apos;s happening with your platform today.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Shops"
          value={displayValue(metrics?.activeShops)}
          trend={{ value: `${displayValue(metrics?.totalShops)} total shops`, isPositive: true }}
          icon={Building2}
          iconColor="green"
          sparklineData={[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, metrics?.activeShops ?? 0]}
        />
        <StatCard
          title="Active Users"
          value={displayValue(metrics?.activeUsers)}
          trend={{ value: `${displayValue(metrics?.totalUsers)} total users`, isPositive: true }}
          icon={Users}
          iconColor="blue"
          sparklineData={[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, metrics?.activeUsers ?? 0]}
        />
        <StatCard
          title="Pending Shops"
          value={displayValue(metrics?.pendingShops)}
          trend={{ value: 'Awaiting approval', isPositive: false }}
          icon={AlertTriangle}
          iconColor="orange"
          sparklineData={[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, metrics?.pendingShops ?? 0]}
        />
        <StatCard
          title="New Users This Month"
          value={displayValue(metrics?.newUsersThisMonth)}
          trend={{ value: 'Current month', isPositive: true }}
          icon={UserRound}
          iconColor="green"
          sparklineData={[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, metrics?.newUsersThisMonth ?? 0]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
        <div className="flex min-h-0 lg:col-span-2 lg:h-full">
          <OverviewChart data={chartData} />
        </div>
        <div className="flex min-h-0 flex-col gap-6 lg:h-full lg:min-h-0">
          <div className="flex min-h-0 flex-1 flex-col">
            <TrafficSourcesChart
              data={metrics?.shopStatusCounts ?? []}
              total={metrics?.totalShops ?? 0}
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <MonthlyGoalsCard
              activeShops={metrics?.activeShops ?? 0}
              totalShops={metrics?.totalShops ?? 0}
              activeUsers={metrics?.activeUsers ?? 0}
              totalUsers={metrics?.totalUsers ?? 0}
              pendingShops={metrics?.pendingShops ?? 0}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminOverviewPage