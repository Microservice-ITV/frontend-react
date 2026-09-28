import { useEffect } from 'react'
import { DollarSign, Package, ShoppingCart, Users } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import StatCard from '@/features/dashboard/components/widgets/StatCard'
import OverviewChart from '@/features/dashboard/components/widgets/OverviewChart'
import TrafficSourcesChart from '@/features/dashboard/components/widgets/TrafficSourcesChart'
import MonthlyGoalsCard from '@/features/dashboard/components/widgets/MonthlyGoalsCard'
import { fetchSellerOrdersByShop, fetchSellerProductsByShop } from '@/features/seller/store'

const SellerOverviewPage = () => {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector((state) => state.auth.user)
  const orders = useAppSelector((state) => state.sellerOrders.items)
  const products = useAppSelector((state) => state.sellerProducts.items)
  const activeShopId = authUser?.active_shop_id ?? null

  useEffect(() => {
    if (activeShopId) dispatch(fetchSellerProductsByShop({ shopId: activeShopId }))
    if (activeShopId || authUser?.id) {
      dispatch(fetchSellerOrdersByShop({ userId: authUser?.id, activeShopId }))
    }
  }, [activeShopId, authUser?.id, dispatch])

  // Seller's share of each order; co-mingled orders with other owners' shops
  // contribute only their own portion (keeps revenue consistent with /orders).
  const orderShareTotal = (order: (typeof orders)[number]) =>
    Number(order.sellerTotals?.total ?? order.totals.total ?? 0)

  const revenue = orders.reduce((sum, order) => sum + orderShareTotal(order), 0)
  const customers = new Set(orders.map((order) => order.customerId)).size
  const activeProducts = products.filter((product) => product.status === 'active').length
  const lowStockProducts = products.filter((product) => product.stock <= 5).length
  const monthlySales = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - index))
    const monthOrders = orders.filter((order) => {
      const orderDate = new Date(order.placedAt || order.createdAt || 0)
      return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear()
    })
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      users: monthOrders.reduce((sum, order) => sum + orderShareTotal(order), 0),
      shops: monthOrders.length,
      pending: monthOrders.filter((order) => order.status.toLowerCase() === 'pending').length,
    }
  })
  const orderStatuses = [...new Set(orders.map((order) => order.status))]
  const statusColors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6']
  const statusData = orderStatuses.map((status, index) => ({
    statusId: index,
    count: orders.filter((order) => order.status === status).length,
  }))
  const statusLabels = Object.fromEntries(
    orderStatuses.map((status, index) => [index, { name: status, color: statusColors[index % statusColors.length] }]),
  )

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
          value={revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          icon={DollarSign}
          iconColor="green"
          sparklineData={[20, 35, 30, 45, 50, 55, 60, 58, 70, 75, 80, 85]}
        />
        <StatCard
          title="Active Users"
          value={customers.toLocaleString()}
          icon={Users}
          iconColor="blue"
          sparklineData={[40, 45, 50, 48, 55, 60, 65, 70, 68, 75, 80, 82]}
        />
        <StatCard
          title="Total Orders"
          value={orders.length.toLocaleString()}
          icon={ShoppingCart}
          iconColor="blue"
          sparklineData={[80, 75, 70, 65, 60, 55, 50, 48, 45, 42, 40, 38]}
        />
        <StatCard
          title="Page Views"
          value={activeProducts.toLocaleString()}
          icon={Package}
          iconColor="orange"
          sparklineData={[30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
        <div className="flex min-h-0 lg:col-span-2 lg:h-full">
          <OverviewChart
            data={monthlySales}
            title="Sales Overview"
            description="Revenue and orders from your shop"
            metricLabels={{ users: 'Revenue', shops: 'Orders', pending: 'Pending' }}
          />
        </div>
        <div className="flex min-h-0 flex-col gap-6 lg:h-full lg:min-h-0">
          <div className="flex min-h-0 flex-1 flex-col">
            <TrafficSourcesChart
              data={statusData}
              total={orders.length}
              title="Order Status"
              description="Current order distribution"
              statusLabels={statusLabels}
              totalLabel="Orders"
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <MonthlyGoalsCard
              activeShops={activeProducts}
              totalShops={products.length}
              activeUsers={products.length - lowStockProducts}
              totalUsers={products.length}
              pendingShops={lowStockProducts}
              title="Inventory Snapshot"
              description="Current product stock from the database"
              goalLabels={['Active Products', 'Products In Stock', 'Low Stock']}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default SellerOverviewPage