import { createSlice } from '@reduxjs/toolkit'
import type { AdminWeightRatesState } from '../types/shippingAdminTypes'
import { deleteAdminWeightRate, fetchAdminWeightRates } from './adminWeightRatesThunks'

const initialState: AdminWeightRatesState = {
  items: [],
  status: 'idle',
  error: null,
  total: 0,
  page: 1,
  pageSize: 20,
  mutationStatus: 'idle',
  mutationError: null,
}

const adminWeightRatesSlice = createSlice({
  name: 'adminWeightRates',
  initialState,
  reducers: {
    resetAdminWeightRates(state) {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminWeightRates.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAdminWeightRates.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.weightRates
        state.total = action.payload.total
        state.page = action.payload.page
        state.pageSize = action.payload.pageSize
        state.mutationError = null
      })
      .addCase(fetchAdminWeightRates.rejected, (state, action) => {
        state.status = 'failed'
        state.items = []
        state.total = 0
        state.error =
          (action.payload as string) ??
          'Unable to load weight rates right now. Please try again.'
      })
      .addCase(deleteAdminWeightRate.pending, (state) => {
        state.mutationStatus = 'loading'
        state.mutationError = null
      })
      .addCase(deleteAdminWeightRate.fulfilled, (state) => {
        state.mutationStatus = 'succeeded'
      })
      .addCase(deleteAdminWeightRate.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.mutationError =
          (action.payload as string) ?? 'Could not delete weight rate. Try again.'
      })
  },
})

export const { resetAdminWeightRates } = adminWeightRatesSlice.actions
export default adminWeightRatesSlice.reducer
