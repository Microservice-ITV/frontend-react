import { createSlice } from '@reduxjs/toolkit'
import type { ProductsState } from '../types/productTypes'
import { fetchProductsByCategory, fetchProductDetail } from './productThunks'

const initialState: ProductsState = {
    items: [],
    selectedProduct: null,
    status: 'idle',
    error: null,
    detailRequestedId: null,
}

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearSelectedProduct(state) {
            state.selectedProduct = null
            state.detailRequestedId = null
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

            // DETAIL — clear previous PDP so we never flash the wrong product; track request id for races
            .addCase(fetchProductDetail.pending, (state, action) => {
                state.detailRequestedId = action.meta.arg
                state.selectedProduct = null
                state.status = 'loading'
                state.error = null
            })
            .addCase(fetchProductDetail.fulfilled, (state, action) => {
                if (String(action.meta.arg) !== String(state.detailRequestedId)) {
                    return
                }
                state.status = 'succeeded'
                state.selectedProduct = action.payload
                state.error = null
            })
            .addCase(fetchProductDetail.rejected, (state, action) => {
                if (String(action.meta.arg) !== String(state.detailRequestedId)) {
                    return
                }
                state.status = 'failed'
                state.error = (action.payload as string) ?? 'Failed to load product'
                state.selectedProduct = null
                state.detailRequestedId = null
            })
    },
})

export const { clearSelectedProduct } = productSlice.actions
export default productSlice.reducer