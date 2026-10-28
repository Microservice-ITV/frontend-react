import { createSlice, createSelector } from '@reduxjs/toolkit'
import { checkoutCart, guestCheckoutCart, completeCheckout, fetchSagaStatus, fetchSagaStatusByCheckout, fetchSagaStatistics, fetchCheckoutStatus } from './checkoutThunks'
import type {
    CheckoutPaymentStatus,
    CheckoutResponse,
    CheckoutStatusResponse,
} from '../types/checkoutTypes'
import type { SagaStatusResponse } from '../types/sagaTypes'

import type { CheckoutLineTax } from '../api/checkoutApi'

export type PaymentMethod = 'prepaid' | 'cod'
export type PrepaidProvider = 'card' | 'kpay' | 'wavepay' | 'ayapay' | 'cash' | 'cbpay'

export type CashTender = {
    /** Amount the customer hands over (income). */
    income: number
    /** Change to return: max(0, income - order total). */
    refund: number
}

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
    prepaidProvider: PrepaidProvider
    cashTender: CashTender | null
    /** Cart tax amount used in payment totals (cash order total, etc.). */
    taxAmount: number
    itemTaxes: CheckoutLineTax[]
    /** True only while a real tax quote is running (tax is on with a rate above 0%). */
    taxQuoting: boolean
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
    paymentMethod: 'cod',
    sessionPaymentMethod: null,
    prepaidProvider: 'card',
    cashTender: null,
    taxAmount: 0,
    itemTaxes: [],
    taxQuoting: false,
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
            state.loading = false
            state.isPlacingOrder = false
            state.isAwaitingFinalStatus = false
            state.sessionPaymentMethod = null
            state.prepaidProvider = 'card'
            state.cashTender = null
            state.taxAmount = 0
            state.itemTaxes = []
            state.taxQuoting = false
        },
        setPaymentMethod(state, action: { payload: PaymentMethod }) {
            state.paymentMethod = action.payload
            state.sessionPaymentMethod = action.payload
            if (action.payload !== 'prepaid') {
                state.prepaidProvider = 'card'
                state.cashTender = null
            }
        },
        setPrepaidProvider(state, action: { payload: PrepaidProvider }) {
            state.prepaidProvider = action.payload
            if (action.payload !== 'cash') {
                state.cashTender = null
            }
        },
        setCashTender(state, action: { payload: CashTender | null }) {
            state.cashTender = action.payload
        },
        setCheckoutTaxAmount(state, action: { payload: number }) {
            state.taxAmount = Math.max(0, Number(action.payload) || 0)
        },
        setItemTaxes(state, action: { payload: CheckoutLineTax[] }) {
            state.itemTaxes = action.payload
        },
        setTaxQuoting(state, action: { payload: boolean }) {
            state.taxQuoting = action.payload
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
            .addCase(guestCheckoutCart.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(guestCheckoutCart.fulfilled, (state, action) => {
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
            .addCase(guestCheckoutCart.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload?.message ?? 'Checkout failed'
            })
            .addCase(fetchCheckoutStatus.pending, () => {
                // Polling must not set loading. That flag blocks a payment-method
                // change and was snapping Cash on Delivery back to Prepaid.
            })
            .addCase(fetchCheckoutStatus.fulfilled, (state, action) => {
                state.currentStatus = action.payload
                state.paymentStatus = action.payload.status
                const secret = action.payload.client_secret ?? action.payload.payment?.client_secret
                if (secret) {
                    state.clientSecret = secret
                }
                if (typeof action.payload.payment_method === 'string') {
                    const pm = action.payload.payment_method as PaymentMethod
                    if ((pm === 'prepaid' || pm === 'cod') && state.sessionPaymentMethod == null) {
                        state.sessionPaymentMethod = pm
                        state.paymentMethod = pm
                    }
                }
                if (['PAID', 'COMPLETED', 'FAILED', 'FAILED_STOCK', 'FAILED_PAYMENT', 'EXPIRED'].includes(action.payload.status)) {
                    state.isAwaitingFinalStatus = false
                }
            })
            .addCase(fetchCheckoutStatus.rejected, (state, action) => {
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
            // Read-only saga polls must NOT touch `loading`. That flag means
            // "a checkout session is being created", and real user actions depend on
            // it: CheckoutPage holds back checkoutCart() while it is set, and
            // GuestCheckoutPage disables its Continue button. Toggling it every 5s
            // from a background poll made that button flicker on/off, and because
            // `loading` is a dependency of the checkout-status polling effect in
            // CheckoutGatePage, each saga tick also tore that poller down and
            // skipped a cycle of its refresh.
            .addCase(fetchSagaStatus.pending, () => {
                // no-op: a status poll is not checkout-loading state
            })
            .addCase(fetchSagaStatus.fulfilled, (state, action) => {
                state.sagaStatus = action.payload
            })
            .addCase(fetchSagaStatus.rejected, () => {
                // no-op: a failed status poll is not checkout-loading state
            })
            .addCase(fetchSagaStatusByCheckout.pending, () => {
                // no-op: a status poll is not checkout-loading state
            })
            .addCase(fetchSagaStatusByCheckout.fulfilled, (state, action) => {
                state.sagaStatus = action.payload
            })
            .addCase(fetchSagaStatusByCheckout.rejected, () => {
                // no-op: a failed status poll is not checkout-loading state
            })
            .addCase(fetchSagaStatistics.pending, () => {
                // no-op: a statistics read is not checkout-loading state
            })
            .addCase(fetchSagaStatistics.fulfilled, (state, action) => {
                state.sagaStatistics = action.payload
            })
            .addCase(fetchSagaStatistics.rejected, () => {
                // no-op: a failed statistics read is not checkout-loading state
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
    setPrepaidProvider,
    setCashTender,
    setCheckoutTaxAmount,
    setItemTaxes,
    setTaxQuoting,
} = checkoutSlice.actions

export const selectPrepaidProvider = (state: { checkout: CheckoutState }) =>
    state.checkout.prepaidProvider

export const selectCashTender = (state: { checkout: CheckoutState }) =>
    state.checkout.cashTender

export const selectCheckoutTaxAmount = (state: { checkout: CheckoutState }) =>
    state.checkout.taxAmount

export default checkoutSlice.reducer
