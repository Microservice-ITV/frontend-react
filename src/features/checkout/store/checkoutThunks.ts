import { createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { orderClient } from '@/lib/api/orderClient'
import type { CheckoutStatusResponse } from '../types/checkoutTypes'
import type { SagaStatusResponse, SagaCheckoutResponse } from '../types/sagaTypes'

const IDEMPOTENCY_STORAGE_PREFIX = 'dni.checkout.idempotency.v1'

const generateIdempotencyKey = (userId: string) => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }
    return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function checkoutRequestSignature(
    items: ReadonlyArray<{ productId: unknown; variantId?: unknown; quantity: unknown }>,
    paymentMethod: unknown,
    deliveryAddress?: unknown,
): string {
    const normalizedItems = items
        .map((item) => [
            String(item.productId),
            item.variantId == null ? '' : String(item.variantId),
            Number(item.quantity),
        ])
        .sort((left, right) =>
            String(JSON.stringify(left)).localeCompare(String(JSON.stringify(right))),
        )
    return JSON.stringify({ items: normalizedItems, paymentMethod, deliveryAddress })
}

function getCheckoutIdempotencyKey(userId: string, signature: string): string {
    const storageKey = `${IDEMPOTENCY_STORAGE_PREFIX}.${encodeURIComponent(userId)}`
    let stored: unknown
    const raw = sessionStorage.getItem(storageKey)
    if (raw) {
        try {
            stored = JSON.parse(raw)
        } catch {
            stored = undefined
        }
    }

    const entries = Array.isArray(stored)
        ? stored.filter(
              (entry): entry is [string, string] =>
                  Array.isArray(entry) &&
                  entry.length === 2 &&
                  typeof entry[0] === 'string' &&
                  typeof entry[1] === 'string',
          )
        : []
    const existing = entries.find(([storedSignature]) => storedSignature === signature)
    if (existing) return existing[1]

    const idempotencyKey = generateIdempotencyKey(userId)
    sessionStorage.setItem(
        storageKey,
        JSON.stringify([...entries, [signature, idempotencyKey]]),
    )
    return idempotencyKey
}

function clearCheckoutIdempotencyKey(userId: string, signature: string): void {
    const storageKey = `${IDEMPOTENCY_STORAGE_PREFIX}.${encodeURIComponent(userId)}`
    try {
        const stored: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]')
        if (!Array.isArray(stored)) return
        const remaining = stored.filter(
            (entry) => !Array.isArray(entry) || entry[0] !== signature,
        )
        if (remaining.length === 0) {
            sessionStorage.removeItem(storageKey)
        } else {
            sessionStorage.setItem(storageKey, JSON.stringify(remaining))
        }
    } catch (error) {
        console.warn('[Checkout] Could not clear the completed checkout idempotency key:', error)
    }
}

function checkoutRequestErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data: unknown = error.response?.data
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            const response = data as Record<string, unknown>
            if (typeof response.error === 'string' && response.error.trim()) {
                return response.error
            }

            const validationErrors = response.errors
            if (validationErrors && typeof validationErrors === 'object') {
                for (const messages of Object.values(validationErrors)) {
                    if (Array.isArray(messages)) {
                        const message = messages.find(
                            (value): value is string =>
                                typeof value === 'string' && value.trim() !== '',
                        )
                        if (message) return message
                    }
                    if (typeof messages === 'string' && messages.trim()) return messages
                }
            }

            if (typeof response.message === 'string' && response.message.trim()) {
                return response.message
            }
        }

        if (!error.response) {
            return 'The connection to the Order Service was interrupted. Your checkout may still be processing. Refresh and check checkout status before submitting again.'
        }
    }

    return error instanceof Error && error.message.trim()
        ? error.message
        : 'Checkout could not be started. Please try again.'
}

export const checkoutCart = createAsyncThunk<
    SagaCheckoutResponse,
    void,
    { state: any; rejectValue: string }
>(
    'cart/checkout',
    async (_, { getState, rejectWithValue }) => {
        const state = getState()
        
        const { items } = state.cart
        const userId = state.auth.user?.id
        const selectedItems = items.filter(item => item.selected)

        if (!userId) {
            return rejectWithValue('User not authenticated')
        }

        if (selectedItems.length === 0) {
            return rejectWithValue('No items selected')
        }

        try {
            const stableUserId = String(userId)
            const signature = checkoutRequestSignature(
                selectedItems,
                state.checkout.paymentMethod,
            )
            const idempotencyKey = getCheckoutIdempotencyKey(stableUserId, signature)

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
            const normalized: SagaCheckoutResponse = 'data' in raw ? raw.data : raw
            const checkout = normalized?.checkout
            const checkoutId =
                normalized.checkout_id ??
                checkout?.checkout_id ??
                checkout?.id ??
                null
            if (checkoutId) clearCheckoutIdempotencyKey(stableUserId, signature)
            return checkoutId
                ? { ...normalized, checkout_id: checkoutId }
                : normalized
        } catch (error: unknown) {
            return rejectWithValue(checkoutRequestErrorMessage(error))
        }
    },
    {
        // Prevent multiple checkout attempts while one is already in progress
        condition: (_, { getState }) => {
          const { loading } = getState().checkout
    
          if (loading) {
            return false
          }
    
          return true
        },
      }
)

export type GuestCheckoutError = {
    message: string
    code?: string
    retryAfterSeconds?: number
}

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
            city_id?: number | null
            district: string
            district_id?: number | null
            ward: string
            address_line_1: string
            address_line_2?: string | null
            postal_code?: string | null
            latitude?: number | null
            longitude?: number | null
            delivery_note?: string | null
        }
    },
    { state: any; rejectValue: GuestCheckoutError }
>(
    'cart/guestCheckout',
    async ({ guest_id, delivery_address }, { getState, rejectWithValue }) => {
        const state = getState()

        const { items } = state.cart
        const selectedItems = items.filter((item: any) => item.selected)

        if (!guest_id) {
            return rejectWithValue({ message: 'Guest session not found' })
        }

        if (selectedItems.length === 0) {
            return rejectWithValue({ message: 'No items selected' })
        }

        try {
            const stableGuestId = String(guest_id)
            const signature = checkoutRequestSignature(
                selectedItems,
                state.checkout.paymentMethod,
                delivery_address,
            )
            const idempotencyKey = getCheckoutIdempotencyKey(stableGuestId, signature)

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

            if (checkoutId) clearCheckoutIdempotencyKey(stableGuestId, signature)
            return checkoutId
                ? { ...normalized, checkout_id: checkoutId }
                : normalized
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const data = error.response?.data
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    const response = data as { code?: string; error?: string; retry_after_seconds?: number }
                    if (response.code === 'guest_checkout_temporarily_blocked') {
                        return rejectWithValue({
                            message: response.error || 'Guest checkout is temporarily blocked for 15 minutes.',
                            code: response.code,
                            retryAfterSeconds: Number(response.retry_after_seconds) || 15 * 60,
                        })
                    }
                }
            }
            return rejectWithValue({ message: checkoutRequestErrorMessage(error) })
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
    async ({ checkoutId, paymentData }, { rejectWithValue }) => {
        try {
            const response = await orderClient.post(`/saga/orders/${checkoutId}/complete`, { 
                payment_data: paymentData 
            })
            const raw = response.data as any
            const normalized = 'data' in raw ? raw.data : raw
            return normalized
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error ?? 'Failed to complete checkout'
            )
        }
    }
)

export const fetchSagaStatus = createAsyncThunk<
    SagaStatusResponse,
    string,
    { rejectValue: string }
>(
    'checkout/fetchSagaStatus',
    async (sagaId, { rejectWithValue }) => {
        try {
            const response = await orderClient.get<SagaStatusResponse | { data: SagaStatusResponse }>(`/saga/sagas/${sagaId}`)
            const raw = response.data as SagaStatusResponse | { data: SagaStatusResponse }
            const normalized: SagaStatusResponse = 'data' in raw ? raw.data : raw
            return normalized
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error ?? 'Failed to fetch saga status'
            )
        }
    }
)

export const fetchSagaStatusByCheckout = createAsyncThunk<
    SagaStatusResponse,
    string,
    { rejectValue: string }
>(
    'checkout/fetchSagaStatusByCheckout',
    async (checkoutId, { rejectWithValue }) => {
        try {
            const response = await orderClient.get<any>(`/saga/orders/${checkoutId}/status`)
            const raw = response.data as any
            const normalized = 'data' in raw ? raw.data : raw
            const saga = normalized?.saga

            if (!saga) {
                return rejectWithValue('No saga found for this order')
            }

            return {
                saga_id: saga.saga_id,
                status: saga.status,
                type: 'checkout',
                order_id: checkoutId,
                current_step: saga.current_step,
                total_steps: saga.total_steps ?? 0,
                completed_steps: saga.completed_steps ?? [],
                failed_steps: saga.failed_steps ?? [],
                compensation_required: false,
            } as SagaStatusResponse
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error ?? 'Failed to fetch saga status'
            )
        }
    }
)

export const fetchSagaStatistics = createAsyncThunk<
    any,
    void,
    { rejectValue: string }
>(
    'checkout/fetchSagaStatistics',
    async (_, { rejectWithValue }) => {
        try {
            const response = await orderClient.get<any>('/saga/sagas/statistics')
            const raw = response.data as any
            const normalized = 'data' in raw ? raw.data : raw
            return normalized
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error ?? 'Failed to fetch saga statistics'
            )
        }
    }
)

export const fetchCheckoutStatus = createAsyncThunk<
    CheckoutStatusResponse,
    string,
    { rejectValue: string }
>(
    'checkout/fetchCheckoutStatus',
    async (checkoutId, { rejectWithValue }) => {
        try {
            const response = await orderClient.get<CheckoutStatusResponse | { data: CheckoutStatusResponse }>(
                `/orders/checkout-sessions/${checkoutId}`,
            )
            const raw = response.data as CheckoutStatusResponse | { data: CheckoutStatusResponse }
            const normalized: CheckoutStatusResponse = 'data' in raw ? raw.data : raw
            return normalized
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error ?? 'Failed to fetch checkout status'
            )
        }
    }
)