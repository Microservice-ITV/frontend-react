import type { RootState } from '@/app/store'

export const selectAdminDashboardMetrics = (state: RootState) => state.adminDashboard.metrics
export const selectAdminDashboardStatus = (state: RootState) => state.adminDashboard.status
export const selectAdminDashboardError = (state: RootState) => state.adminDashboard.error
