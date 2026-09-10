import { createSlice } from '@reduxjs/toolkit'
import type { ProductsState } from '../types/productTypes'
import { fetchProductsByCategory, fetchProductDetail, fetchRecentProducts, searchProducts } from './productThunks'

const initialState: ProductsState = {
    items: [],
    selectedProduct: null,
    status: 'idle',
    error: null,
    detailRequestedId: null,
    searchResults: [],
    searchStatus: 'idle',
    searchError: null,
    recentProducts: [],
    recentProductsNextCursor: null,
    recentProductsHasNextPage: false,
    recentProductsLoadedCursors: [],
    recentProductsLoading: false,
    recentProductsStatus: 'idle',
    recentProductsError: null,
}

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearSelectedProduct(state) {
            state.selectedProduct = null
            state.detailRequestedId = null
        },
        clearSearch(state) {
            state.searchResults = []
            state.searchStatus = 'idle'
            state.searchError = null
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

            // RECENT PRODUCTS
            .addCase(fetchRecentProducts.pending, (state) => {
                state.recentProductsLoading = true
                state.recentProductsStatus = 'loading'
                state.recentProductsError = null
            })
            .addCase(fetchRecentProducts.fulfilled, (state, action) => {
                const isLoadMore = Boolean(action.meta.arg.cursor)
                const products = isLoadMore
                    ? [...state.recentProducts, ...action.payload.items]
                    : action.payload.items
                state.recentProducts = products.filter(
                    (product, index, allProducts) => allProducts.findIndex((item) => item.id === product.id) === index,
                )
                if (action.meta.arg.cursor) {
                    state.recentProductsLoadedCursors.push(action.meta.arg.cursor)
                }
                state.recentProductsHasNextPage = action.payload.hasNextPage
                state.recentProductsNextCursor = action.payload.nextCursor
                state.recentProductsLoading = false
                state.recentProductsStatus = 'succeeded'
            })
            .addCase(fetchRecentProducts.rejected, (state, action) => {
                state.recentProductsLoading = false
                state.recentProductsStatus = state.recentProducts.length > 0 ? 'succeeded' : 'failed'
                state.recentProductsError = (action.payload as string) ?? 'Failed to load recently added products'
            })

            // SEARCH
            .addCase(searchProducts.pending, (state) => {
                state.searchStatus = 'loading'
                state.searchError = null
            })
            .addCase(searchProducts.fulfilled, (state, action) => {
                state.searchStatus = 'succeeded'
                state.searchResults = action.payload
            })
            .addCase(searchProducts.rejected, (state, action) => {
                state.searchStatus = 'failed'
                state.searchError = (action.payload as string) ?? 'Search failed'
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

export const { clearSelectedProduct, clearSearch } = productSlice.actions
export default productSlice.reducer