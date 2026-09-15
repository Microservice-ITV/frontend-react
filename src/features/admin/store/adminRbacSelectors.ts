import type { RootState } from '@/app/store'

export const selectAdminRbacRoles = (state: RootState) => state.adminRbac.roles
export const selectAdminRbacStatus = (state: RootState) => state.adminRbac.status
export const selectAdminRbacError = (state: RootState) => state.adminRbac.error
export const selectAdminRbacPermissions = (state: RootState) => state.adminRbac.permissions
export const selectAdminRbacPermissionsStatus = (state: RootState) =>
  state.adminRbac.permissionsStatus
export const selectAdminRbacPermissionsError = (state: RootState) =>
  state.adminRbac.permissionsError