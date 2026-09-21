import type { RootState } from '@/app/store'

export const selectAdminDistanceRanges = (state: RootState) => state.adminDistanceRanges.items
export const selectAdminDistanceRangesStatus = (state: RootState) =>
  state.adminDistanceRanges.status
export const selectAdminDistanceRangesError = (state: RootState) =>
  state.adminDistanceRanges.error
export const selectAdminDistanceRangesTotal = (state: RootState) =>
  state.adminDistanceRanges.total
export const selectAdminDistanceRangesPage = (state: RootState) => state.adminDistanceRanges.page
export const selectAdminDistanceRangesPageSize = (state: RootState) =>
  state.adminDistanceRanges.pageSize
export const selectAdminDistanceRangesMutationStatus = (state: RootState) =>
  state.adminDistanceRanges.mutationStatus
export const selectAdminDistanceRangesMutationError = (state: RootState) =>
  state.adminDistanceRanges.mutationError
