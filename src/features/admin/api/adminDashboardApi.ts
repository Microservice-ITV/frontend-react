import { authClient } from '@/lib/api/authClient'
import { productClient } from '@/lib/api/productClient'

export type AdminUserMetrics = {
  active_users: number
  total_users: number
  new_users_this_month: number
  monthly_users: Array<{ month: string; count: number }>
}

export type AdminShopMetrics = {
  activeShops: number
  pendingShops: number
  inactiveShops: number
  totalShops: number
  monthlyShops: Array<{ month: string; count: number }>
  monthlyPendingShops: Array<{ month: string; count: number }>
  shopStatusCounts: Array<{ statusId: number; count: number }>
}

type MetricsResponse<T> = {
  success: boolean
  data: T
}

export const adminDashboardApi = {
  getUserMetrics() {
    return authClient.get<MetricsResponse<AdminUserMetrics>>('/admin/dashboard/metrics')
  },

  getShopMetrics() {
    return productClient.get<MetricsResponse<AdminShopMetrics>>('/admin/dashboard/metrics')
  },
}
