import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'

const selectFlashDealsState = (state: RootState) => state.flashDeals

export const selectFlashDeals = createSelector(
  [selectFlashDealsState],
  (state) => state.items
)

export const selectFlashDealsLoading = createSelector(
  [selectFlashDealsState],
  (state) => state.loading
)

export const selectFlashDealsError = createSelector(
  [selectFlashDealsState],
  (state) => state.error
)

export const selectFlashDealsSelectedId = createSelector(
  [selectFlashDealsState],
  (state) => state.selectedId
)

export const selectFlashDealsPagination = createSelector(
  [selectFlashDealsState],
  (state) => state.pagination
)

export const selectFlashDealsDeleting = createSelector(
  [selectFlashDealsState],
  (state) => state.deleting
)

export const selectSelectedFlashDeal = createSelector(
  [selectFlashDeals, selectFlashDealsSelectedId],
  (items, selectedId) => items.find((item) => item.id === selectedId) ?? null
)