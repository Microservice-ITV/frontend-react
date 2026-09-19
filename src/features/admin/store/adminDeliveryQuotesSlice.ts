import { createSlice } from '@reduxjs/toolkit'
import type { AdminDeliveryQuotesState } from '../types/shippingAdminTypes'
import {
  cancelAdminDeliveryQuote,
  fetchAdminDeliveryQuotes,
} from './adminDeliveryQuotesThunks'

const initialState: AdminDeliveryQuotesState = {
  items: [],
  status: 'idle',
  error: null,
  total: 0,
  page: 1,
  pageSize: 20,
  mutationStatus: 'idle',
  mutationError: null,
}

const adminDeliveryQuotesSlice = createSlice({
  name: 'adminDeliveryQuotes',
  initialState,
  reducers: {
    resetAdminDeliveryQuotes() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDeliveryQuotes.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAdminDeliveryQuotes.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.quotes
        state.total = action.payload.total
        state.page = action.payload.page
        state.pageSize = action.payload.pageSize
        state.mutationError = null
      })
      .addCase(fetchAdminDeliveryQuotes.rejected, (state, action) => {
        state.status = 'failed'
        state.items = []
        state.total = 0
        state.error =
          (action.payload as string) ??
          'Unable to load delivery quotes right now. Please try again.'
      })
      .addCase(cancelAdminDeliveryQuote.pending, (state) => {
        state.mutationStatus = 'loading'
        state.mutationError = null
      })
      .addCase(cancelAdminDeliveryQuote.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        const index = state.items.findIndex((quote) => quote.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
      .addCase(cancelAdminDeliveryQuote.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.mutationError =
          (action.payload as string) ?? 'Could not cancel delivery quote. Try again.'
      })
  },
})

export const { resetAdminDeliveryQuotes } = adminDeliveryQuotesSlice.actions
export default adminDeliveryQuotesSlice.reducer
