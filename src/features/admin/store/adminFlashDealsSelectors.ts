import type { RootState } from '@/app/store'

export const selectAdminFlashDealCampaigns = (state: RootState) => state.adminFlashDeals.campaigns
export const selectAdminFlashDealStatus = (state: RootState) => state.adminFlashDeals.status
export const selectAdminFlashDealError = (state: RootState) => state.adminFlashDeals.error