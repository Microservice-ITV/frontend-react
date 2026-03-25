import type { RootState } from '@/app/store'

export const selectAdminShops = (state: RootState) => state.adminShops.items
export const selectAdminShopsStatus = (state: RootState) => state.adminShops.status
export const selectAdminShopsError = (state: RootState) => state.adminShops.error