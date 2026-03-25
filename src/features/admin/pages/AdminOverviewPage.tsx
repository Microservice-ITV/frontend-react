import { Building2, Users, AlertTriangle } from 'lucide-react'
import StatCard from '@/features/dashboard/components/widgets/StatCard'
import OverviewChart from '@/features/dashboard/components/widgets/OverviewChart'
import TrafficSourcesChart from '@/features/dashboard/components/widgets/TrafficSourcesChart'
import MonthlyGoalsCard from '@/features/dashboard/components/widgets/MonthlyGoalsCard'

const AdminOverviewPage = () => {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Dashboard</h2>
        <p className="mt-0.5 text-xs text-slate-600">
          Welcome back. Here&apos;s what&apos;s happening with your platform today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Shops"
          value="128"
          trend={{ value: '+5.2% vs last month', isPositive: true }}
          icon={Building2}
          iconColor="green"
          sparklineData={[60, 65, 70, 72, 75, 78, 80, 82, 85, 88, 90, 95]}
        />
        <StatCard
          title="Active Users"
          value="12,904"
          trend={{ value: '+12.1% vs last month', isPositive: true }}
          icon={Users}
          iconColor="blue"
          sparklineData={[40, 50, 55, 60, 65, 70, 75, 78, 82, 85, 88, 92]}
        />
        <StatCard
          title="Open Alerts"
          value="7"
          trend={{ value: '-2 vs last month', isPositive: true }}
          icon={AlertTriangle}
          iconColor="orange"
          sparklineData={[80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25]}
        />
        <StatCard
          title="System Health"
          value="99.9%"
          trend={{ value: 'Uptime', isPositive: true }}
          icon={Building2}
          iconColor="green"
          sparklineData={[95, 96, 97, 98, 99, 99, 99, 100, 100, 100, 100, 100]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
        <div className="flex min-h-0 lg:col-span-2 lg:h-full">
          <OverviewChart />
        </div>
        <div className="flex min-h-0 flex-col gap-6 lg:h-full lg:min-h-0">
          <div className="flex min-h-0 flex-1 flex-col">
            <TrafficSourcesChart />
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <MonthlyGoalsCard />
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminOverviewPage