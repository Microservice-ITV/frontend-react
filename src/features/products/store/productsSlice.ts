import { createSlice } from '@reduxjs/toolkit'
import type { ProductsState } from '../types/productTypes'
import { fetchProductsByCategory } from './productThunks'

const initialState: ProductsState = {
    items: [],
    status: 'idle',
    error: null,
}

const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProductsByCategory.pending, (state) => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.items = action.payload
            })
            .addCase(fetchProductsByCategory.rejected, (state, action) => {
                state.status = 'failed'
                state.error = (action.payload as string) ?? 'Failed to load products'
            })
    },
})

export default productsSlice.reducer