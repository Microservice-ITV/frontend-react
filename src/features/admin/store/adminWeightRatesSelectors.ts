import type { RootState } from '@/app/store'

export const selectAdminWeightRates = (state: RootState) => state.adminWeightRates.items
export const selectAdminWeightRatesStatus = (state: RootState) => state.adminWeightRates.status
export const selectAdminWeightRatesError = (state: RootState) => state.adminWeightRates.error
export const selectAdminWeightRatesTotal = (state: RootState) => state.adminWeightRates.total
export const selectAdminWeightRatesPage = (state: RootState) => state.adminWeightRates.page
export const selectAdminWeightRatesPageSize = (state: RootState) => state.adminWeightRates.pageSize
export const selectAdminWeightRatesMutationStatus = (state: RootState) =>
  state.adminWeightRates.mutationStatus
export const selectAdminWeightRatesMutationError = (state: RootState) =>
  state.adminWeightRates.mutationError
