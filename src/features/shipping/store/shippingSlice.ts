import { createSlice } from '@reduxjs/toolkit'
import type { ShopShippingProfileRow, ShopCalculatedShipping } from '../types/shippingTypes'
import { fetchCheckoutShippingCalculation, fetchShopProfilesForCurrentCart } from './shippingThunks'

export type ShippingState = {
    /** Sorted shop ids joined — matches last successful batch */
    batchKey: string
    profilesByShopId: Record<string, ShopShippingProfileRow>
    batchStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
    batchError: string | null

    calculateKey: string
    feesByShopId: Record<string, ShopCalculatedShipping>
    calculateStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
    calculateError: string | null
    calculateRaw: unknown | null
}

const initialState: ShippingState = {
    batchKey: '',
    profilesByShopId: {},
    batchStatus: 'idle',
    batchError: null,

    calculateKey: '',
    feesByShopId: {},
    calculateStatus: 'idle',
    calculateError: null,
    calculateRaw: null,
}

const shippingSlice = createSlice({
    name: 'shipping',
    initialState,
    reducers: {
        clearShippingCalculate(state) {
            state.calculateKey = ''
            state.feesByShopId = {}
            state.calculateStatus = 'idle'
            state.calculateError = null
            state.calculateRaw = null
        },
        clearShippingBatch(state) {
            state.batchKey = ''
            state.profilesByShopId = {}
            state.batchStatus = 'idle'
            state.batchError = null
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchShopProfilesForCurrentCart.pending, (state) => {
                state.batchStatus = 'loading'
                state.batchError = null
            })
            .addCase(fetchShopProfilesForCurrentCart.fulfilled, (state, action) => {
                state.batchStatus = 'succeeded'
                state.profilesByShopId = action.payload.profilesByShopId
                state.batchKey = action.payload.shopIdsKey
            })
            .addCase(fetchShopProfilesForCurrentCart.rejected, (state, action) => {
                state.batchStatus = 'failed'
                state.batchError = (action.payload as string) ?? action.error.message ?? 'Failed'
            })
            .addCase(fetchCheckoutShippingCalculation.pending, (state) => {
                state.calculateStatus = 'loading'
                state.calculateError = null
            })
            .addCase(fetchCheckoutShippingCalculation.fulfilled, (state, action) => {
                state.calculateStatus = 'succeeded'
                state.feesByShopId = action.payload.byShopId
                state.calculateKey = action.payload.cacheKey
                state.calculateRaw = action.payload.raw
            })
            .addCase(fetchCheckoutShippingCalculation.rejected, (state, action) => {
                state.calculateStatus = 'failed'
                state.calculateError = (action.payload as string) ?? action.error.message ?? 'Failed'
            })
    },
})

export const { clearShippingCalculate, clearShippingBatch } = shippingSlice.actions
export default shippingSlice.reducer