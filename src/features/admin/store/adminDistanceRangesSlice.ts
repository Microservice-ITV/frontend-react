import { createSlice } from '@reduxjs/toolkit'
import type { AdminDistanceRangesState } from '../types/shippingAdminTypes'
import { deleteAdminDistanceRange, fetchAdminDistanceRanges } from './adminDistanceRangesThunks'

const initialState: AdminDistanceRangesState = {
  items: [],
  status: 'idle',
  error: null,
  total: 0,
  page: 1,
  pageSize: 20,
  mutationStatus: 'idle',
  mutationError: null,
}

const adminDistanceRangesSlice = createSlice({
  name: 'adminDistanceRanges',
  initialState,
  reducers: {
    resetAdminDistanceRanges(state) {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDistanceRanges.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAdminDistanceRanges.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.distanceRanges
        state.total = action.payload.total
        state.page = action.payload.page
        state.pageSize = action.payload.pageSize
        state.mutationError = null
      })
      .addCase(fetchAdminDistanceRanges.rejected, (state, action) => {
        state.status = 'failed'
        state.items = []
        state.total = 0
        state.error =
          (action.payload as string) ??
          'Unable to load distance ranges right now. Please try again.'
      })
      .addCase(deleteAdminDistanceRange.pending, (state) => {
        state.mutationStatus = 'loading'
        state.mutationError = null
      })
      .addCase(deleteAdminDistanceRange.fulfilled, (state) => {
        state.mutationStatus = 'succeeded'
      })
      .addCase(deleteAdminDistanceRange.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.mutationError =
          (action.payload as string) ?? 'Could not delete distance range. Try again.'
      })
  },
})

export const { resetAdminDistanceRanges } = adminDistanceRangesSlice.actions
export default adminDistanceRangesSlice.reducer
