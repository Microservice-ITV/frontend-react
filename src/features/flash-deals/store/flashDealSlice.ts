import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FlashDeal, FlashDealsResponse } from '../types/flashDealTypes'
import {
  fetchFlashDeals,
  fetchFlashDealById,
  createFlashDeal,
  updateFlashDeal,
  deleteFlashDeal,
  publishFlashDeal,
  activateFlashDeal,
  pauseFlashDeal,
  cancelFlashDeal,
  updateFlashDealStock,
} from './flashDealThunks'

interface FlashDealsState {
  items: FlashDeal[]
  loading: boolean
  error: string | null
  selectedId: string | null
  deleting: Record<string, boolean>
  pagination: FlashDealsResponse['pagination'] | null
}

const initialState: FlashDealsState = {
  items: [],
  loading: false,
  error: null,
  selectedId: null,
  deleting: {},
  pagination: null,
}

const applyUpdate = (state: FlashDealsState, deal: FlashDeal) => {
  const index = state.items.findIndex((item) => item.id === deal.id)
  if (index >= 0) {
    state.items[index] = deal
  } else {
    state.items.unshift(deal)
  }
}

const flashDealsSlice = createSlice({
  name: 'flashDeals',
  initialState,
  reducers: {
    setSelectedId: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlashDeals.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFlashDeals.fulfilled, (state, action: PayloadAction<FlashDealsResponse>) => {
        state.loading = false
        state.items = action.payload.data
        state.pagination = action.payload.pagination
      })
      .addCase(fetchFlashDeals.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to load flash deals'
      })
      .addCase(fetchFlashDealById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFlashDealById.fulfilled, (state, action: PayloadAction<FlashDeal>) => {
        state.loading = false
        const index = state.items.findIndex((item) => item.id === action.payload.id)
        if (index >= 0) {
          state.items[index] = action.payload
        } else {
          state.items.push(action.payload)
        }
      })
      .addCase(fetchFlashDealById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to load flash deal'
      })
      .addCase(createFlashDeal.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createFlashDeal.fulfilled, (state, action: PayloadAction<FlashDeal>) => {
        state.loading = false
        state.items.unshift(action.payload)
        if (state.pagination) {
          state.pagination.total += 1
        }
      })
      .addCase(createFlashDeal.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to create flash deal'
      })
      .addCase(updateFlashDeal.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateFlashDeal.fulfilled, (state, action: PayloadAction<FlashDeal>) => {
        state.loading = false
        const index = state.items.findIndex((item) => item.id === action.payload.id)
        if (index >= 0) {
          state.items[index] = action.payload
        }
      })
      .addCase(updateFlashDeal.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Failed to update flash deal'
      })
      .addCase(deleteFlashDeal.pending, (state, action: PayloadAction<string, string, { arg: string }>) => {
        state.deleting[action.meta.arg] = true
      })
      .addCase(deleteFlashDeal.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((item) => item.id !== action.payload)
        delete state.deleting[action.payload]
        if (state.pagination) {
          state.pagination.total = Math.max(0, state.pagination.total - 1)
        }
      })
      .addCase(deleteFlashDeal.rejected, (state, action) => {
        delete state.deleting[action.meta.arg]
        state.error = action.payload ?? 'Failed to delete flash deal'
      })
      .addCase(publishFlashDeal.pending, (state) => {
        state.error = null
      })
      .addCase(publishFlashDeal.fulfilled, (state, action: PayloadAction<FlashDeal>) => {
        applyUpdate(state, action.payload)
      })
      .addCase(publishFlashDeal.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to publish flash deal'
      })
      .addCase(activateFlashDeal.pending, (state) => {
        state.error = null
      })
      .addCase(activateFlashDeal.fulfilled, (state, action: PayloadAction<FlashDeal>) => {
        applyUpdate(state, action.payload)
      })
      .addCase(activateFlashDeal.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to activate flash deal'
      })
      .addCase(pauseFlashDeal.pending, (state) => {
        state.error = null
      })
      .addCase(pauseFlashDeal.fulfilled, (state, action: PayloadAction<FlashDeal>) => {
        applyUpdate(state, action.payload)
      })
      .addCase(pauseFlashDeal.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to pause flash deal'
      })
      .addCase(cancelFlashDeal.pending, (state) => {
        state.error = null
      })
      .addCase(cancelFlashDeal.fulfilled, (state, action: PayloadAction<FlashDeal>) => {
        applyUpdate(state, action.payload)
      })
      .addCase(cancelFlashDeal.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to cancel flash deal'
      })
      .addCase(updateFlashDealStock.pending, (state) => {
        state.error = null
      })
      .addCase(updateFlashDealStock.fulfilled, (state, action: PayloadAction<FlashDeal>) => {
        applyUpdate(state, action.payload)
      })
      .addCase(updateFlashDealStock.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to update flash deal stock'
      })
  },
})

export const { setSelectedId, clearError } = flashDealsSlice.actions
export default flashDealsSlice.reducer