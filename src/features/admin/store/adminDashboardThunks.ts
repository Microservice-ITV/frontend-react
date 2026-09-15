import { createAsyncThunk } from '@reduxjs/toolkit'
import { adminDashboardApi, type AdminShopMetrics, type AdminUserMetrics } from '../api/adminDashboardApi'
import type { AdminDashboardMetrics } from './adminDashboardSlice'

const getApiErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string; error?: { message?: string } } } }).response
    return response?.data?.message ?? response?.data?.error?.message ?? ''
  }
  return error instanceof Error ? error.message : ''
}

export const fetchAdminDashboardMetrics = createAsyncThunk<
  AdminDashboardMetrics,
  void,
  { rejectValue: string }
>('adminDashboard/fetchMetrics', async (_, { rejectWithValue }) => {
  try {
    const [usersResponse, shopsResponse] = await Promise.all([
      adminDashboardApi.getUserMetrics(),
      adminDashboardApi.getShopMetrics(),
    ])
    const users: AdminUserMetrics = usersResponse.data.data
    const shops: AdminShopMetrics = shopsResponse.data.data

    return {
      activeUsers: users.active_users,
      totalUsers: users.total_users,
      newUsersThisMonth: users.new_users_this_month,
      activeShops: shops.activeShops,
      pendingShops: shops.pendingShops,
      inactiveShops: shops.inactiveShops,
      totalShops: shops.totalShops,
      monthlyUsers: users.monthly_users,
      monthlyShops: shops.monthlyShops,
      monthlyPendingShops: shops.monthlyPendingShops,
      shopStatusCounts: shops.shopStatusCounts,
    }
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error) || 'Unable to load dashboard metrics.')
  }
})
