import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { HeroBanner } from '../types/heroBannerTypes'
import {
  fetchHeroBanners,
  fetchHeroBannerById,
  createHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
} from './heroBannerThunks'

interface HeroBannerState {
  items: HeroBanner[]
  selected: HeroBanner | null
  loading: boolean
  submitting: boolean
  deleting: boolean
  error: string | null
}

const initialState: HeroBannerState = {
  items: [],
  selected: null,
  loading: false,
  submitting: false,
  deleting: false,
  error: null,
}

const heroBannerSlice = createSlice({
  name: 'heroBanners',
  initialState,
  reducers: {
    setHeroBanners: (state, action: PayloadAction<HeroBanner[]>) => {
      state.items = action.payload
    },
    setSelectedHeroBanner: (state, action: PayloadAction<HeroBanner | null>) => {
      state.selected = action.payload
    },
    clearError: (state) => { state.error = null },
    resetHeroBannerState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHeroBanners.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchHeroBanners.fulfilled, (state, action) => { state.loading = false; state.items = action.payload })
      .addCase(fetchHeroBanners.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to load hero banners' })

    builder
      .addCase(fetchHeroBannerById.pending, (state) => { state.loading = true; state.error = null; state.selected = null })
      .addCase(fetchHeroBannerById.fulfilled, (state, action) => { state.loading = false; state.selected = action.payload })
      .addCase(fetchHeroBannerById.rejected, (state, action) => { state.loading = false; state.error = action.payload || 'Failed to load hero banner' })

    builder
      .addCase(createHeroBanner.pending, (state) => { state.submitting = true; state.error = null })
      .addCase(createHeroBanner.fulfilled, (state, action) => {
        state.submitting = false
        state.items.push(action.payload)
        state.items.sort((a, b) => a.sortOrder - b.sortOrder)
      })
      .addCase(createHeroBanner.rejected, (state, action) => { state.submitting = false; state.error = action.payload || 'Failed to create hero banner' })

    builder
      .addCase(updateHeroBanner.pending, (state) => { state.submitting = true; state.error = null })
      .addCase(updateHeroBanner.fulfilled, (state, action) => {
        state.submitting = false
        const index = state.items.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) { state.items[index] = action.payload }
        state.items.sort((a, b) => a.sortOrder - b.sortOrder)
        if (state.selected?.id === action.payload.id) { state.selected = action.payload }
      })
      .addCase(updateHeroBanner.rejected, (state, action) => { state.submitting = false; state.error = action.payload || 'Failed to update hero banner' })

    builder
      .addCase(deleteHeroBanner.pending, (state) => { state.deleting = true; state.error = null })
      .addCase(deleteHeroBanner.fulfilled, (state, action) => {
        state.deleting = false
        state.items = state.items.filter((item) => item.id !== action.payload)
        if (state.selected?.id === action.payload) { state.selected = null }
      })
      .addCase(deleteHeroBanner.rejected, (state, action) => { state.deleting = false; state.error = action.payload || 'Failed to delete hero banner' })
  },
})

export const { setHeroBanners, setSelectedHeroBanner, clearError, resetHeroBannerState } = heroBannerSlice.actions
export default heroBannerSlice.reducer
