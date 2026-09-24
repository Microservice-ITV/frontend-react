import { createAsyncThunk } from '@reduxjs/toolkit'
import { orderClient } from '@/lib/api/orderClient'
import type { CheckoutResponse, CheckoutStatusResponse } from '../types/checkoutTypes'
import type { SagaStatusResponse, SagaCheckoutResponse } from '../types/sagaTypes'

const generateIdempotencyKey = (userId: string) => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }
    return `checkout-${userId}-${Date.now()}`
}

function normalizeError(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const data = (error as { response?: { data?: { error?: unknown; message?: unknown } } })
            .response?.data
        const err = data?.error ?? data?.message
        if (typeof err === 'string' && err.trim()) return err
        if (err && typeof err === 'object' && 'message' in err) {
            const msg = (err as { message?: unknown }).message
            if (typeof msg === 'string' && msg.trim()) return msg
        }
    }
    if (error instanceof Error && error.message) return error.message
    return fallback
}

export const checkoutCart = createAsyncThunk<
    CheckoutResponse,
    void,
    { state: any; rejectValue: string }
>(
    'cart/checkout',
    async (_, { getState, rejectWithValue }) => {
        const state = getState()

        const { items } = state.cart
        const userId = state.auth.user?.id
        const selectedItems = items.filter((item: { selected?: boolean }) => item.selected)

        if (!userId) {
            return rejectWithValue('User not authenticated')
        }

        if (selectedItems.length === 0) {
            return rejectWithValue('No items selected')
        }

        try {
            // Keep idempotency key short (<255) to satisfy backend validation.
            const idempotencyKey = generateIdempotencyKey(String(userId))

            const response = await orderClient.post<SagaCheckoutResponse>(
                '/saga/orders/checkout',
                {
                    idempotency_key: idempotencyKey,
                    user_id: String(userId),
                    payment_method: state.checkout.paymentMethod,
                    items: selectedItems.map(item => ({
                        product_id: item.productId,
                        qty: item.quantity,
                        ...(item.variantId ? { variant_id: item.variantId } : {}),
                    })),
                },
                {
                    headers: {
                        'Idempotency-Key': idempotencyKey,
                    },
                },
            )

            const raw = response.data as any
            const normalized = 'data' in raw && raw.data ? raw.data : raw
            const checkout = normalized?.checkout
            const checkoutId =
                normalized.checkout_id ??
                checkout?.checkout_id ??
                checkout?.id ??
                null

            if (!checkoutId) {
                return rejectWithValue('Checkout session was not created')
            }

            return {
                checkout_id: String(checkoutId),
                message:
                    typeof normalized.message === 'string'
                        ? normalized.message
                        : 'Order received and we are processing your order',
                expire_at: normalized.expire_at ?? null,
                status: normalized.status,
                saga_id: normalized.saga_id,
                existing: Boolean(normalized.existing),
            } as CheckoutResponse
        } catch (error: unknown) {
            return rejectWithValue(normalizeError(error, 'Checkout failed'))
        }
    },
    {
        // Prevent multiple checkout attempts while one is already in progress,
        // and do not auto-retry after a hard failure (stops 404 spam loops).
        condition: (_, { getState }) => {
            const { loading, error, currentCheckout } = getState().checkout
            if (loading) return false
            if (currentCheckout?.checkout_id) return false
            if (error) return false
            return true
        },
    },
)

export const guestCheckoutCart = createAsyncThunk<
    SagaCheckoutResponse,
    {
        guest_id: string
        delivery_address: {
            full_name: string
            phone_no: string
            email?: string | null
            country_code: string
            country: string
            state: string
            city: string
            district: string
            ward: string
            address_line_1: string
            address_line_2?: string | null
            postal_code?: string | null
            latitude?: number | null
            longitude?: number | null
            delivery_note?: string | null
        }
    },
    { state: any; rejectValue: string }
>(
    'cart/guestCheckout',
    async ({ guest_id, delivery_address }, { getState, rejectWithValue }) => {
        const state = getState()

        const { items } = state.cart
        const selectedItems = items.filter((item: any) => item.selected)

        if (!guest_id) {
            return rejectWithValue('Guest session not found')
        }

        if (selectedItems.length === 0) {
            return rejectWithValue('No items selected')
        }

        try {
            const idempotencyKey = generateIdempotencyKey(String(guest_id))

            const response = await orderClient.post<SagaCheckoutResponse>(
                '/saga/orders/checkout',
                {
                    idempotency_key: idempotencyKey,
                    user_id: String(guest_id),
                    guest_id: String(guest_id),
                    payment_method: state.checkout.paymentMethod,
                    items: selectedItems.map((item: any) => ({
                        product_id: item.productId,
                        qty: item.quantity,
                        ...(item.variantId ? { variant_id: item.variantId } : {}),
                    })),
                    delivery_address,
                },
                {
                    headers: {
                        'Idempotency-Key': idempotencyKey,
                    },
                },
            )

            const raw = response.data as any
            const normalized: SagaCheckoutResponse = 'data' in raw ? raw.data : raw
            const checkout = normalized?.checkout
            const checkoutId =
                normalized.checkout_id ??
                checkout?.checkout_id ??
                checkout?.id ??
                null

            return checkoutId
                ? { ...normalized, checkout_id: checkoutId }
                : normalized
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error ?? 'Checkout failed')
        }
    },
    {
        condition: (_, { getState }) => {
            const { loading } = getState().checkout
            if (loading) return false
            return true
        },
    },
)

export const completeCheckout = createAsyncThunk<
    any,
    { checkoutId: string; paymentData?: any },
    { rejectValue: string }
>(
    'checkout/complete',
    async ({ checkoutId }, { rejectWithValue }) => {
        try {
            // Payment completion is driven by Stripe confirm + payment.completed events.
            // Poll checkout session status instead of a removed saga complete endpoint.
            const response = await orderClient.get<
                CheckoutStatusResponse | { data: CheckoutStatusResponse }
            >(`/orders/checkout-sessions/${checkoutId}`)
            const raw = response.data as CheckoutStatusResponse | { data: CheckoutStatusResponse }
            return 'data' in raw ? raw.data : raw
        } catch (error: unknown) {
            return rejectWithValue(normalizeError(error, 'Failed to complete checkout'))
        }
    },
)

export const fetchSagaStatus = createAsyncThunk<
    SagaStatusResponse,
    string,
    { rejectValue: string }
>('checkout/fetchSagaStatus', async (sagaId, { rejectWithValue }) => {
    try {
        const response = await orderClient.get<SagaStatusResponse | { data: SagaStatusResponse }>(
            `/orders/checkout-sessions/${sagaId}`,
        )
        const raw = response.data as any
        const normalized = 'data' in raw ? raw.data : raw
        return {
            saga_id: String(sagaId),
            status: 'IN_PROGRESS',
            type: 'checkout',
            order_id: normalized?.checkout_id ?? String(sagaId),
            current_step: 0,
            total_steps: 0,
            completed_steps: [],
            failed_steps: [],
            compensation_required: false,
        } as SagaStatusResponse
    } catch (error: unknown) {
        return rejectWithValue(normalizeError(error, 'Failed to fetch saga status'))
    }
})

export const fetchSagaStatusByCheckout = createAsyncThunk<
    SagaStatusResponse,
    string,
    { rejectValue: string }
>('checkout/fetchSagaStatusByCheckout', async (checkoutId, { rejectWithValue }) => {
    try {
        const response = await orderClient.get<any>(`/orders/checkout-sessions/${checkoutId}`)
        const raw = response.data as any
        const normalized = 'data' in raw ? raw.data : raw

        return {
            saga_id: checkoutId,
            status: 'IN_PROGRESS',
            type: 'checkout',
            order_id: checkoutId,
            current_step: 0,
            total_steps: 0,
            completed_steps: [],
            failed_steps: [],
            compensation_required: false,
            error_message: normalized?.message,
        } as SagaStatusResponse
    } catch (error: unknown) {
        return rejectWithValue(normalizeError(error, 'Failed to fetch saga status'))
    }
})

export const fetchSagaStatistics = createAsyncThunk<
    any,
    void,
    { rejectValue: string }
>('checkout/fetchSagaStatistics', async (_, { rejectWithValue }) => {
    // Saga statistics endpoint is not part of the current order-service API.
    return rejectWithValue('Saga statistics are unavailable')
})

export const fetchCheckoutStatus = createAsyncThunk<
    CheckoutStatusResponse,
    string,
    { rejectValue: string }
>('checkout/fetchCheckoutStatus', async (checkoutId, { rejectWithValue }) => {
    try {
        const response = await orderClient.get<
            CheckoutStatusResponse | { data: CheckoutStatusResponse }
        >(`/orders/checkout-sessions/${checkoutId}`)
        const raw = response.data as CheckoutStatusResponse | { data: CheckoutStatusResponse }
        const normalized: CheckoutStatusResponse = 'data' in raw ? raw.data : raw
        return normalized
    } catch (error: unknown) {
        return rejectWithValue(normalizeError(error, 'Failed to fetch checkout status'))
    }
})
