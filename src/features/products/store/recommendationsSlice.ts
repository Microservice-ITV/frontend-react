import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Product } from '../types/productTypes'
import { recommendationApi } from '../api/recommendationApi'

interface RecommendationState {
    relatedProducts: Product[]
    broughtTogetherProducts: Product[]
    status: 'idle' | 'loading' | 'succeeded' | 'failed'
    error: string | null
}

const initialState: RecommendationState = {
    relatedProducts: [],
    broughtTogetherProducts: [],
    status: 'idle',
    error: null,
}

function dedupeProducts(products: Product[]): Product[] {
    const seen = new Set<string>()
    const unique: Product[] = []
    for (const product of products) {
        if (!product.id || seen.has(product.id)) continue
        seen.add(product.id)
        unique.push(product)
    }
    return unique
}

// Async thunks - aggregate recommendations across all cart product IDs
export const fetchRelatedProducts = createAsyncThunk(
    'recommendations/fetchRelatedProducts',
    async (productIds: string[], { rejectWithValue }) => {
        try {
            const responses = await Promise.all(
                productIds.map((id) => recommendationApi.getRelatedProducts(id)),
            )
            const merged = responses.flatMap((response) => response.data.data)
            return dedupeProducts(merged)
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch related products')
        }
    }
)

export const fetchBroughtTogetherProducts = createAsyncThunk(
    'recommendations/fetchBroughtTogetherProducts',
    async (productIds: string[], { rejectWithValue }) => {
        try {
            const responses = await Promise.all(
                productIds.map((id) => recommendationApi.getBroughtTogetherProducts(id)),
            )
            const merged = responses.flatMap((response) => response.data.data)
            return dedupeProducts(merged)
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch brought-together products')
        }
    }
)

export const recommendationsSlice = createSlice({
    name: 'recommendations',
    initialState,
    reducers: {
        clearRecommendations(state) {
            state.relatedProducts = []
            state.broughtTogetherProducts = []
            state.status = 'idle'
            state.error = null
        },
        resetRecommendationsStatus(state) {
            state.status = 'idle'
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch related products
            .addCase(fetchRelatedProducts.pending, (state) => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(fetchRelatedProducts.fulfilled, (state, action) => {
                state.relatedProducts = action.payload
                state.status = 'succeeded'
            })
            .addCase(fetchRelatedProducts.rejected, (state, action) => {
                state.status = 'failed'
                state.error = action.payload as string
            })
            // Fetch brought-together products
            .addCase(fetchBroughtTogetherProducts.pending, (state) => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(fetchBroughtTogetherProducts.fulfilled, (state, action) => {
                state.broughtTogetherProducts = action.payload
                state.status = 'succeeded'
            })
            .addCase(fetchBroughtTogetherProducts.rejected, (state, action) => {
                state.status = 'failed'
                state.error = action.payload as string
            })
    },
})

export const { clearRecommendations, resetRecommendationsStatus } = recommendationsSlice.actions

export default recommendationsSlice.reducer

// Selectors
export const selectRelatedProducts = (state: { recommendations: RecommendationState }) => state.recommendations.relatedProducts
export const selectBroughtTogetherProducts = (state: { recommendations: RecommendationState }) => state.recommendations.broughtTogetherProducts
export const selectRecommendationsStatus = (state: { recommendations: RecommendationState }) => state.recommendations.status
export const selectRecommendationsError = (state: { recommendations: RecommendationState }) => state.recommendations.error