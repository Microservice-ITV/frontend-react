import { createSlice, createSelector } from '@reduxjs/toolkit'
import { checkoutCart, completeCheckout, fetchSagaStatus, fetchSagaStatusByCheckout, fetchSagaStatistics, fetchCheckoutStatus } from './checkoutThunks'
import type {
    CheckoutPaymentStatus,
    CheckoutResponse,
    CheckoutStatusResponse,
} from '../types/checkoutTypes'
import type { SagaStatusResponse } from '../types/sagaTypes'

export type PaymentMethod = 'prepaid' | 'cod'

interface CheckoutState {
    currentCheckout: CheckoutResponse | null
    currentStatus: CheckoutStatusResponse | null
    sagaStatus: SagaStatusResponse | null
    sagaId: string | null
    sagaStatistics: any | null
    paymentStatus: CheckoutPaymentStatus | null
    clientSecret: string | null
    isPlacingOrder: boolean
    isAwaitingFinalStatus: boolean
    paymentMethod: PaymentMethod
    sessionPaymentMethod: PaymentMethod | null
    loading: boolean
    error: string | null
}

const initialState: CheckoutState = {
    currentCheckout: null,
    currentStatus: null,
    sagaStatus: null,
    sagaId: null,
    sagaStatistics: null,
    paymentStatus: null,
    clientSecret: null,
    isPlacingOrder: false,
    isAwaitingFinalStatus: false,
    paymentMethod: 'prepaid',
    sessionPaymentMethod: null,
    loading: false,
    error: null,
}

const checkoutSlice = createSlice({
    name: 'checkout',
    initialState,
    reducers: {
        setCurrentCheckout(state, action: { payload: CheckoutResponse | null }) {
            state.currentCheckout = action.payload
        },
        clearCheckout(state) {
            state.currentCheckout = null
            state.currentStatus = null
            state.sagaStatus = null
            state.sagaId = null
            state.sagaStatistics = null
            state.paymentStatus = null
            state.clientSecret = null
            state.error = null
            state.isPlacingOrder = false
            state.isAwaitingFinalStatus = false
            state.sessionPaymentMethod = null
        },
        setPaymentMethod(state, action: { payload: PaymentMethod }) {
            state.paymentMethod = action.payload
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
        setSagaStatus(state, action: { payload: SagaStatusResponse | null }) {
            state.sagaStatus = action.payload
        },
        setSagaId(state, action: { payload: string | null }) {
            state.sagaId = action.payload
        },
        setSagaStatistics(state, action: { payload: any | null }) {
            state.sagaStatistics = action.payload
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
                const checkout = action.payload?.checkout
                const checkoutId =
                    action.payload.checkout_id ??
                    checkout?.checkout_id ??
                    checkout?.id ??
                    null
                if (checkoutId) {
                    state.currentCheckout = {
                        ...action.payload,
                        checkout_id: checkoutId,
                    }
                }
                state.sagaId = action.payload.saga_id || null
                state.paymentStatus = null
                state.clientSecret = null
                state.isAwaitingFinalStatus = false
                state.sessionPaymentMethod = state.paymentMethod
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
                const secret = action.payload.client_secret ?? action.payload.payment?.client_secret
                if (secret) {
                    state.clientSecret = secret
                }
                if (typeof action.payload.payment_method === 'string') {
                    const pm = action.payload.payment_method as PaymentMethod
                    if (pm === 'prepaid' || pm === 'cod') {
                        state.sessionPaymentMethod = pm
                        state.paymentMethod = pm
                    }
                }
                if (['PAID', 'COMPLETED', 'FAILED', 'FAILED_PAYMENT', 'EXPIRED'].includes(action.payload.status)) {
                    state.isAwaitingFinalStatus = false
                }
            })
            .addCase(fetchCheckoutStatus.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Failed to fetch checkout status'
            })
            .addCase(completeCheckout.pending, state => {
                state.loading = true
            })
            .addCase(completeCheckout.fulfilled, (state, action) => {
                state.loading = false
                state.currentStatus = action.payload
                state.isAwaitingFinalStatus = false
            })
            .addCase(completeCheckout.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload ?? 'Failed to complete checkout'
            })
            .addCase(fetchSagaStatus.pending, state => {
                state.loading = true
            })
            .addCase(fetchSagaStatus.fulfilled, (state, action) => {
                state.loading = false
                state.sagaStatus = action.payload
            })
            .addCase(fetchSagaStatus.rejected, (state) => {
                state.loading = false
            })
            .addCase(fetchSagaStatusByCheckout.pending, state => {
                state.loading = true
            })
            .addCase(fetchSagaStatusByCheckout.fulfilled, (state, action) => {
                state.loading = false
                state.sagaStatus = action.payload
            })
            .addCase(fetchSagaStatusByCheckout.rejected, (state) => {
                state.loading = false
            })
            .addCase(fetchSagaStatistics.pending, state => {
                state.loading = true
            })
            .addCase(fetchSagaStatistics.fulfilled, (state, action) => {
                state.loading = false
                state.sagaStatistics = action.payload
            })
            .addCase(fetchSagaStatistics.rejected, (state) => {
                state.loading = false
            })
    },
})

// Selectors
export const selectCheckoutState = (state: { checkout: CheckoutState }) => state.checkout
export const selectCurrentCheckout = (state: { checkout: CheckoutState }) => state.checkout.currentCheckout
export const selectSagaStatus = (state: { checkout: CheckoutState }) => state.checkout.sagaStatus
export const selectSagaId = (state: { checkout: CheckoutState }) => state.checkout.sagaId
export const selectSagaStatistics = (state: { checkout: CheckoutState }) => state.checkout.sagaStatistics
export const selectIsCheckoutLoading = (state: { checkout: CheckoutState }) => state.checkout.loading
export const selectCheckoutError = (state: { checkout: CheckoutState }) => state.checkout.error
export const selectPaymentMethod = (state: { checkout: CheckoutState }) => state.checkout.paymentMethod
export const selectSessionPaymentMethod = (state: { checkout: CheckoutState }) => state.checkout.sessionPaymentMethod

// Memoized selectors
export const selectIsSagaCompleted = createSelector(
    [selectSagaStatus],
    (sagaStatus) => sagaStatus?.status === 'COMPLETED'
)

export const selectIsSagaFailed = createSelector(
    [selectSagaStatus],
    (sagaStatus) => sagaStatus?.status === 'FAILED'
)

export const selectIsSagaInProgress = createSelector(
    [selectSagaStatus],
    (sagaStatus) => sagaStatus?.status === 'IN_PROGRESS'
)

export const selectSagaProgress = createSelector(
    [selectSagaStatus],
    (sagaStatus) => {
        if (!sagaStatus) return 0
        if (sagaStatus.status === 'COMPLETED') return 100
        if (sagaStatus.status === 'FAILED') return 0
        
        const completed = sagaStatus.completed_steps?.length || 0
        const total = sagaStatus.total_steps || 1
        return Math.round((completed / total) * 100)
    }
)

export const {
    setCurrentCheckout,
    clearCheckout,
    setCheckoutPlacingOrder,
    setCheckoutError,
    setCheckoutPaymentStatus,
    setAwaitingFinalStatus,
    setSagaStatus,
    setSagaId,
    setSagaStatistics,
    setPaymentMethod,
} = checkoutSlice.actions

export default checkoutSlice.reducer