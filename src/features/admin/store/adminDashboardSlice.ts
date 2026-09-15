import { createSlice } from '@reduxjs/toolkit'
import { fetchAdminDashboardMetrics } from './adminDashboardThunks'

export type AdminDashboardMetrics = {
  activeUsers: number
  totalUsers: number
  newUsersThisMonth: number
  activeShops: number
  pendingShops: number
  inactiveShops: number
  totalShops: number
  monthlyUsers: Array<{ month: string; count: number }>
  monthlyShops: Array<{ month: string; count: number }>
  monthlyPendingShops: Array<{ month: string; count: number }>
  shopStatusCounts: Array<{ statusId: number; count: number }>
}

type AdminDashboardState = {
  metrics: AdminDashboardMetrics | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: AdminDashboardState = {
  metrics: null,
  status: 'idle',
  error: null,
}

const adminDashboardSlice = createSlice({
  name: 'adminDashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboardMetrics.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAdminDashboardMetrics.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.metrics = action.payload
      })
      .addCase(fetchAdminDashboardMetrics.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Unable to load dashboard metrics.'
      })
  },
})

export default adminDashboardSlice.reducer
