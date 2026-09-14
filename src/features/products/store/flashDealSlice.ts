import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FlashDealsState, GqlFlashDealCampaign } from '../types/flashDealTypes'
import {
  fetchFlashDealCampaigns,
  fetchFlashDealsBySlot,
  fetchActiveTimeSlots,
} from './flashDealThunks'

const initialState: FlashDealsState = {
  campaigns: [],
  products: [],
  timeSlots: [],
  activeSlotId: null,
  activeCategory: 'Top Picks',
  page: 1,
  limit: 50,
  total: 0,
  status: 'idle',
  error: null,
}

const flashDealSlice = createSlice({
  name: 'flashDeals',
  initialState,
  reducers: {
    setActiveSlotId(state, action: PayloadAction<string>) {
      state.activeSlotId = action.payload
    },
    setActiveCategory(state, action: PayloadAction<string>) {
      state.activeCategory = action.payload
    },
    clearFlashDealProducts(state) {
      state.products = []
      state.total = 0
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchFlashDealCampaigns ──
      .addCase(fetchFlashDealCampaigns.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchFlashDealCampaigns.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.campaigns = action.payload

        // Derive time slots from active campaigns
        const now = new Date()
        const allSlots = action.payload
          .filter((c: GqlFlashDealCampaign) => c.status === 'ACTIVE')
          .flatMap((c: GqlFlashDealCampaign) => c.slots)

        // Order: ongoing first, then coming soon, then ended (tie-break by time)
        const statusRank = { ongoing: 0, coming_soon: 1, ended: 2 }
        const seen = new Set<string>()
        state.timeSlots = allSlots
          .filter((s) => {
            if (seen.has(s.slotId)) return false
            seen.add(s.slotId)
            return true
          })
          .map((s) => {
            const start = new Date(s.startTime)
            const end = new Date(s.endTime)
            let status: 'ongoing' | 'coming_soon' | 'ended' = 'coming_soon'
            if (s.status === 'ACTIVE' && start <= now && end >= now) {
              status = 'ongoing'
            } else if (s.status === 'COMPLETED' || end < now) {
              status = 'ended'
            }
            return {
              id: s.slotId,
              label: s.slotTime,
              time: s.slotTime,
              status,
              startTime: start,
              endTime: end,
              totalProducts: s.totalProducts,
            }
          })
          .sort((a, b) => {
            const rankDiff = statusRank[a.status] - statusRank[b.status]
            return rankDiff !== 0 ? rankDiff : a.time.localeCompare(b.time)
          })

        // Auto-select a live slot that actually has products, else the first slot
        if (!state.activeSlotId && state.timeSlots.length > 0) {
          const ongoingWithProducts = state.timeSlots.find(
            (s) => s.status === 'ongoing' && (s.totalProducts ?? 0) > 0,
          )
          state.activeSlotId =
            ongoingWithProducts?.id ??
            state.timeSlots.find((s) => s.status === 'ongoing')?.id ??
            state.timeSlots[0].id
        }
      })
      .addCase(fetchFlashDealCampaigns.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string) ?? 'Failed to load flash deals'
      })

      // ── fetchFlashDealsBySlot ──
      .addCase(fetchFlashDealsBySlot.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchFlashDealsBySlot.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.products = action.payload.products
        state.total = action.payload.total
        state.page = action.payload.page
        state.limit = action.payload.limit
        if (action.payload.slot) {
          state.activeSlotId = action.payload.slot.id
        }
      })
      .addCase(fetchFlashDealsBySlot.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string) ?? 'Failed to load flash deal products'
      })

      // ── fetchActiveTimeSlots ──
      .addCase(fetchActiveTimeSlots.fulfilled, (state, action) => {
        state.timeSlots = action.payload
        if (!state.activeSlotId && action.payload.length > 0) {
          state.activeSlotId = action.payload[0].id
        }
      })
  },
})

export const { setActiveSlotId, setActiveCategory, clearFlashDealProducts } = flashDealSlice.actions
export default flashDealSlice.reducer
