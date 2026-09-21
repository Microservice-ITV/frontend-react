import type { RootState } from '@/app/store'

export const selectAdminDeliveryQuotes = (state: RootState) => state.adminDeliveryQuotes.items
export const selectAdminDeliveryQuotesStatus = (state: RootState) =>
  state.adminDeliveryQuotes.status
export const selectAdminDeliveryQuotesError = (state: RootState) => state.adminDeliveryQuotes.error
export const selectAdminDeliveryQuotesTotal = (state: RootState) => state.adminDeliveryQuotes.total
export const selectAdminDeliveryQuotesMutationStatus = (state: RootState) =>
  state.adminDeliveryQuotes.mutationStatus
export const selectAdminDeliveryQuotesMutationError = (state: RootState) =>
  state.adminDeliveryQuotes.mutationError
