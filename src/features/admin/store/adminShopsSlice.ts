import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AdminShopsState } from '../types/shopTypes'
import { fetchAdminShops, setShopApproval } from './adminShopsThunks'

const initialState: AdminShopsState = {
  items: [],
  status: 'idle',
  error: null,
  moderationStatus: 'idle',
  moderationError: null,
}

const adminShopsSlice = createSlice({
  name: 'adminShops',
  initialState,
  reducers: {
    removeShopsLocally(state, action: PayloadAction<string[]>) {
      const ids = new Set(action.payload)
      state.items = state.items.filter((shop) => !ids.has(shop.id))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminShops.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAdminShops.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
        state.moderationError = null
      })
      .addCase(fetchAdminShops.rejected, (state, action) => {
        state.status = 'failed'
        state.items = []
        state.error =
          (action.payload as string) ?? 'Unable to load shops right now. Please try again.'
      })
      .addCase(setShopApproval.pending, (state) => {
        state.moderationStatus = 'loading'
        state.moderationError = null
      })
      .addCase(setShopApproval.fulfilled, (state) => {
        state.moderationStatus = 'succeeded'
      })
      .addCase(setShopApproval.rejected, (state, action) => {
        state.moderationStatus = 'failed'
        state.moderationError =
          (action.payload as string) ?? 'Could not update shop approval. Try again.'
      })
  },
})

export const { removeShopsLocally } = adminShopsSlice.actions
export default adminShopsSlice.reducer