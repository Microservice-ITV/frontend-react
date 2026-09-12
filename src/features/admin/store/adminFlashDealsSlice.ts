import { createSlice } from '@reduxjs/toolkit'
import type { AdminFlashDealsState } from '../types/adminFlashDealTypes'
import {
  fetchAdminFlashDealCampaigns,
  createAdminFlashDealCampaign,
  createAdminFlashDealSlot,
  setAdminFlashDealSlotStatus,
  assignAdminFlashDealProducts,
  setAdminFlashDealItemStatus,
  updateAdminFlashDealCampaign,
} from './adminFlashDealsThunks'

const initialState: AdminFlashDealsState = {
  campaigns: [],
  status: 'idle',
  error: null,
}

const adminFlashDealsSlice = createSlice({
  name: 'adminFlashDeals',
  initialState,
  reducers: {
    clearAdminFlashDeals(state) {
      state.campaigns = []
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminFlashDealCampaigns.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAdminFlashDealCampaigns.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.campaigns = action.payload
        state.error = null
      })
      .addCase(fetchAdminFlashDealCampaigns.rejected, (state, action) => {
        state.status = 'failed'
        state.error =
          (action.payload as string) ?? 'Unable to load flash deals right now. Please try again.'
      })

    // Mutations share the same state hub — on success the thunk already refetched the list.
    // Here we keep the list intact while an action runs and surface mutation errors inline.
    .addCase(createAdminFlashDealCampaign.rejected, (state, action) => {
      state.error = (action.payload as string) ?? 'Flash deal campaign update failed.'
    })
    .addCase(updateAdminFlashDealCampaign.rejected, (state, action) => {
      state.error = (action.payload as string) ?? 'Flash deal campaign update failed.'
    })
    .addCase(createAdminFlashDealSlot.rejected, (state, action) => {
      state.error = (action.payload as string) ?? 'Flash deal slot update failed.'
    })
    .addCase(setAdminFlashDealSlotStatus.rejected, (state, action) => {
      state.error = (action.payload as string) ?? 'Flash deal slot update failed.'
    })
    .addCase(assignAdminFlashDealProducts.rejected, (state, action) => {
      state.error = (action.payload as string) ?? 'Flash deal product assignment failed.'
    })
    .addCase(setAdminFlashDealItemStatus.rejected, (state, action) => {
      state.error = (action.payload as string) ?? 'Flash deal item update failed.'
    })
  },
})

export const { clearAdminFlashDeals } = adminFlashDealsSlice.actions
export default adminFlashDealsSlice.reducer