import { createSlice } from '@reduxjs/toolkit'
import { checkoutCart } from './checkoutThunks'
import type { CheckoutResponse } from '../types/checkoutTypes'

interface CheckoutState {
    currentCheckout: CheckoutResponse | null
    loading: boolean
    error: string | null
}

const initialState: CheckoutState = {
    currentCheckout: null,
    loading: false,
    error: null,
}

const checkoutSlice = createSlice({
    name: 'checkout',
    initialState,
    reducers: {
        clearCheckout(state) {
            state.currentCheckout = null
        },
    },
    extraReducers: builder => {
        builder
            .addCase(checkoutCart.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(checkoutCart.fulfilled, (state, action) => {
                state.loading = false
                state.currentCheckout = action.payload
            })
            .addCase(checkoutCart.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Checkout failed'
            })
    },
})

export const { clearCheckout } = checkoutSlice.actions
export default checkoutSlice.reducer