import { createSlice } from '@reduxjs/toolkit'
import type { SellerOrder } from '../api/sellerOrderApi'
import { fetchSellerOrdersByShop } from './sellerOrdersThunks'

interface SellerOrdersState {
  items: SellerOrder[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  activeShopId: string | null
}

const initialState: SellerOrdersState = {
  items: [],
  status: 'idle',
  error: null,
  activeShopId: null,
}

const sellerOrdersSlice = createSlice({
  name: 'sellerOrders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerOrdersByShop.pending, (state, action) => {
        state.status = 'loading'
        state.error = null
        state.activeShopId = action.meta.arg.activeShopId ?? null
      })
      .addCase(fetchSellerOrdersByShop.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
        state.activeShopId = action.meta.arg.activeShopId ?? null
      })
      .addCase(fetchSellerOrdersByShop.rejected, (state, action) => {
        state.status = 'failed'
        state.items = []
        state.error = (action.payload as string) ?? 'Unable to load orders right now. Please try again.'
        state.activeShopId = action.meta.arg.activeShopId ?? null
      })
  },
})

export default sellerOrdersSlice.reducer
