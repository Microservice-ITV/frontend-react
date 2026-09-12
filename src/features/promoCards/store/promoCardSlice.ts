import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { PromoCard } from '../types/promoCardTypes'
import {
  fetchPromoCards,
  fetchPromoCardById,
  createPromoCard,
  updatePromoCard,
  deletePromoCard,
} from './promoCardThunks'

interface PromoCardState {
  items: PromoCard[]
  selected: PromoCard | null
  loading: boolean
  submitting: boolean
  deleting: boolean
  error: string | null
}

const initialState: PromoCardState = {
  items: [],
  selected: null,
  loading: false,
  submitting: false,
  deleting: false,
  error: null,
}

const promoCardSlice = createSlice({
  name: 'promoCards',
  initialState,
  reducers: {
    setPromoCards: (state, action: PayloadAction<PromoCard[]>) => {
      state.items = action.payload
    },
    setSelectedPromoCard: (state, action: PayloadAction<PromoCard | null>) => {
      state.selected = action.payload
    },
    clearError: (state) => { state.error = null },
    resetPromoCardState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPromoCards.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchPromoCards.fulfilled, (state, action) => { state.loading = false; state.items = action.payload })
      .addCase(fetchPromoCards.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to load promo cards' })

    builder
      .addCase(fetchPromoCardById.pending, (state) => { state.loading = true; state.error = null; state.selected = null })
      .addCase(fetchPromoCardById.fulfilled, (state, action) => { state.loading = false; state.selected = action.payload })
      .addCase(fetchPromoCardById.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to load promo card' })

    builder
      .addCase(createPromoCard.pending, (state) => { state.submitting = true; state.error = null })
      .addCase(createPromoCard.fulfilled, (state, action) => {
        state.submitting = false
        state.items.push(action.payload)
        state.items.sort((a, b) => a.sortOrder - b.sortOrder)
      })
      .addCase(createPromoCard.rejected, (state, action) => { state.submitting = false; state.error = action.payload || 'Failed to create promo card' })

    builder
      .addCase(updatePromoCard.pending, (state) => { state.submitting = true; state.error = null })
      .addCase(updatePromoCard.fulfilled, (state, action) => {
        state.submitting = false
        const index = state.items.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) { state.items[index] = action.payload }
        state.items.sort((a, b) => a.sortOrder - b.sortOrder)
        if (state.selected?.id === action.payload.id) { state.selected = action.payload }
      })
      .addCase(updatePromoCard.rejected, (state, action) => { state.submitting = false; state.error = action.payload || 'Failed to update promo card' })

    builder
      .addCase(deletePromoCard.pending, (state) => { state.deleting = true; state.error = null })
      .addCase(deletePromoCard.fulfilled, (state, action) => {
        state.deleting = false
        state.items = state.items.filter((item) => item.id !== action.payload)
        if (state.selected?.id === action.payload) { state.selected = null }
      })
      .addCase(deletePromoCard.rejected, (state, action) => { state.deleting = false; state.error = action.payload || 'Failed to delete promo card' })
  },
})

export const { setPromoCards, setSelectedPromoCard, clearError, resetPromoCardState } = promoCardSlice.actions
export default promoCardSlice.reducer
