import type { RootState } from '@/app/store'

export const selectAdminShops = (state: RootState) => state.adminShops.items
export const selectAdminShopsStatus = (state: RootState) => state.adminShops.status
export const selectAdminShopsError = (state: RootState) => state.adminShops.error
export const selectAdminShopsModerationStatus = (state: RootState) =>
  state.adminShops.moderationStatus
export const selectAdminShopsModerationError = (state: RootState) =>
  state.adminShops.moderationError