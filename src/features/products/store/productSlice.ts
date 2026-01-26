import { createSlice } from '@reduxjs/toolkit'
import type { ProductsState } from '../types/productTypes'
import { fetchProductsByCategory, fetchProductDetail } from './productThunks'

const initialState: ProductsState = {
    items: [],
    selectedProduct: null,
    status: 'idle',
    error: null,
}

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearSelectedProduct(state) {
            state.selectedProduct = null
        },
    },
    extraReducers: (builder) => {
        builder
            // LIST
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

            // DETAIL
            .addCase(fetchProductDetail.pending, (state) => {
                state.status = 'loading'
            })
            .addCase(fetchProductDetail.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.selectedProduct = action.payload
            })
            .addCase(fetchProductDetail.rejected, (state, action) => {
                state.status = 'failed'
                state.error =
                (action.payload as string) ?? 'Failed to load product'
            })
    },
})

export const { clearSelectedProduct } = productSlice.actions
export default productSlice.reducer