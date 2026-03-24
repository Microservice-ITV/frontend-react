import { DollarSign, Users, ShoppingCart, Eye } from 'lucide-react'
import StatCard from '@/features/dashboard/components/widgets/StatCard'
import OverviewChart from '@/features/dashboard/components/widgets/OverviewChart'
import TrafficSourcesChart from '@/features/dashboard/components/widgets/TrafficSourcesChart'
import MonthlyGoalsCard from '@/features/dashboard/components/widgets/MonthlyGoalsCard'

const SellerOverviewPage = () => {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Dashboard</h2>
        <p className="mt-0.5 text-xs text-slate-600">
          Welcome back. Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$48,295"
          trend={{ value: '+12.5% vs last month', isPositive: true }}
          icon={DollarSign}
          iconColor="green"
          sparklineData={[20, 35, 30, 45, 50, 55, 60, 58, 70, 75, 80, 85]}
        />
        <StatCard
          title="Active Users"
          value="2,847"
          trend={{ value: '+8.2% vs last month', isPositive: true }}
          icon={Users}
          iconColor="blue"
          sparklineData={[40, 45, 50, 48, 55, 60, 65, 70, 68, 75, 80, 82]}
        />
        <StatCard
          title="Total Orders"
          value="1,432"
          trend={{ value: '-3.1% vs last month', isPositive: false }}
          icon={ShoppingCart}
          iconColor="blue"
          sparklineData={[80, 75, 70, 65, 60, 55, 50, 48, 45, 42, 40, 38]}
        />
        <StatCard
          title="Page Views"
          value="284K"
          trend={{ value: '+24.7% vs last month', isPositive: true }}
          icon={Eye}
          iconColor="orange"
          sparklineData={[30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90]}
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

export default SellerOverviewPage