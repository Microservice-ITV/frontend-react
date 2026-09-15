import type { RootState } from '@/app/store'

export const selectAdminUsers = (state: RootState) => state.adminUsers.users
export const selectAdminUsersStatus = (state: RootState) => state.adminUsers.status
export const selectAdminUsersError = (state: RootState) => state.adminUsers.error
export const selectAdminUsersTotal = (state: RootState) => state.adminUsers.total
export const selectAdminUsersLastPage = (state: RootState) => state.adminUsers.lastPage
