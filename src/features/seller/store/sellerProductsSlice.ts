import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { SellerProductsState } from '../types/productTypes'
import { fetchSellerProductsByShop } from './sellerProductsThunks'

const initialState: SellerProductsState = {
  items: [],
  status: 'idle',
  error: null,
}

const sellerProductsSlice = createSlice({
  name: 'sellerProducts',
  initialState,
  reducers: {
    removeProductsLocally(state, action: PayloadAction<string[]>) {
      const ids = new Set(action.payload)
      state.items = state.items.filter((product) => !ids.has(product.id))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerProductsByShop.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchSellerProductsByShop.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchSellerProductsByShop.rejected, (state, action) => {
        state.status = 'failed'
        state.items = []
        state.error = (action.payload as string) ?? 'Unable to load products right now. Please try again.'
      })
  },
})

export const { removeProductsLocally } = sellerProductsSlice.actions
export default sellerProductsSlice.reducer