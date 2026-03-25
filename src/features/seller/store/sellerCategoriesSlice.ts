import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { SellerCategoriesState } from '../types/categoryTypes'
import { fetchSellerCategories } from './sellerCategoriesThunks'

const initialState: SellerCategoriesState = {
  items: [],
  status: 'idle',
  error: null,
}

const sellerCategoriesSlice = createSlice({
  name: 'sellerCategories',
  initialState,
  reducers: {
    removeCategoriesLocally(state, action: PayloadAction<string[]>) {
      const ids = new Set(action.payload)
      state.items = state.items.filter((category) => !ids.has(category.id))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerCategories.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchSellerCategories.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchSellerCategories.rejected, (state, action) => {
        state.status = 'failed'
        state.items = []
        state.error = (action.payload as string) ?? 'Unable to load categories right now. Please try again.'
      })
  },
})

export const { removeCategoriesLocally } = sellerCategoriesSlice.actions
export default sellerCategoriesSlice.reducer