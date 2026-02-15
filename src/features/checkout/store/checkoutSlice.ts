import { createSlice } from '@reduxjs/toolkit'
import { checkoutCart, fetchCheckoutStatus } from './checkoutThunks'
import type {
    CheckoutPaymentStatus,
    CheckoutResponse,
    CheckoutStatusResponse,
} from '../types/checkoutTypes'

interface CheckoutState {
    currentCheckout: CheckoutResponse | null
    currentStatus: CheckoutStatusResponse | null
    paymentStatus: CheckoutPaymentStatus | null
    clientSecret: string | null
    isPlacingOrder: boolean
    isAwaitingFinalStatus: boolean
    loading: boolean
    error: string | null
}

const initialState: CheckoutState = {
    currentCheckout: null,
    currentStatus: null,
    paymentStatus: null,
    clientSecret: null,
    isPlacingOrder: false,
    isAwaitingFinalStatus: false,
    loading: false,
    error: null,
}

const checkoutSlice = createSlice({
    name: 'checkout',
    initialState,
    reducers: {
        clearCheckout(state) {
            state.currentCheckout = null
            state.currentStatus = null
            state.paymentStatus = null
            state.clientSecret = null
            state.error = null
            state.isPlacingOrder = false
            state.isAwaitingFinalStatus = false
        },
        setCheckoutPlacingOrder(state, action: { payload: boolean }) {
            state.isPlacingOrder = action.payload
        },
        setCheckoutError(state, action: { payload: string | null }) {
            state.error = action.payload
        },
        setCheckoutPaymentStatus(state, action: { payload: CheckoutPaymentStatus }) {
            state.paymentStatus = action.payload
        },
        setAwaitingFinalStatus(state, action: { payload: boolean }) {
            state.isAwaitingFinalStatus = action.payload
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
                state.paymentStatus = null
                state.clientSecret = null
                state.isAwaitingFinalStatus = false
            })
            .addCase(checkoutCart.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Checkout failed'
            })
            .addCase(fetchCheckoutStatus.pending, state => {
                state.loading = true
            })
            .addCase(fetchCheckoutStatus.fulfilled, (state, action) => {
                state.loading = false
                state.currentStatus = action.payload
                state.paymentStatus = action.payload.status
                if (action.payload.client_secret) {
                    state.clientSecret = action.payload.client_secret
                }
                if (['PAID', 'COMPLETED', 'FAILED', 'FAILED_PAYMENT', 'EXPIRED'].includes(action.payload.status)) {
                    state.isAwaitingFinalStatus = false
                }
            })
            .addCase(fetchCheckoutStatus.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Failed to fetch checkout status'
            })
    },
})

export const {
    clearCheckout,
    setCheckoutPlacingOrder,
    setCheckoutError,
    setCheckoutPaymentStatus,
    setAwaitingFinalStatus,
} = checkoutSlice.actions
export default checkoutSlice.reducer