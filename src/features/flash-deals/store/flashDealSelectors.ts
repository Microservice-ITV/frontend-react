import type { RootState } from '@/app/store'

export const selectFlashDeals = (state: RootState) => state.flashDeals.items
export const selectSelectedFlashDeal = (state: RootState) => state.flashDeals.selected
export const selectFlashDealsPagination = (state: RootState) => state.flashDeals.pagination
export const selectFlashDealsLoading = (state: RootState) => state.flashDeals.loading
export const selectFlashDealsSubmitting = (state: RootState) => state.flashDeals.submitting
export const selectFlashDealsDeleting = (state: RootState) => state.flashDeals.deleting
export const selectFlashDealsActioning = (state: RootState) => state.flashDeals.actioning
export const selectFlashDealsError = (state: RootState) => state.flashDeals.error