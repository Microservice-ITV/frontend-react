import { createAsyncThunk } from '@reduxjs/toolkit'
import { orderClient } from '@/lib/api/orderClient'
import type { AxiosResponse } from 'axios'
import type { CheckoutResponse, CheckoutStatusResponse } from '../types/checkoutTypes'
import type { SagaStatusResponse, SagaCheckoutResponse } from '../types/sagaTypes'

const generateIdempotencyKey = (userId: string) => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }
    return `checkout-${userId}-${Date.now()}`
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
            // Keep idempotency key short (<255) to satisfy backend validation.
            const idempotencyKey = generateIdempotencyKey(String(userId))

            const response = await orderClient.post<SagaCheckoutResponse>('/saga/orders/checkout', {
                idempotency_key: idempotencyKey,
                user_id: String(userId),
                payment_method: state.checkout.paymentMethod,
                items: selectedItems.map(item => ({
                    product_id: item.productId,
                    qty: item.quantity,
                    ...(item.variantId ? { variant_id: item.variantId } : {}),
                })),
                delivery_address: {
                    full_name: '',
                    phone_no: '',
                    country_code: '+1',
                    country: 'United States',
                    state: '',
                    city: '',
                    district: '',
                    ward: '',
                    address_line_1: '',
                    address_line_2: '',
                    postal_code: '',
                    latitude: null,
                    longitude: null,
                    delivery_note: '',
                    shipping_total: 0,
                    shop_shippings: []
                }
            }, {
                headers: {
                    'Idempotency-Key': idempotencyKey,
                },
            })

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
            return rejectWithValue(
                error.response?.data?.error ?? 'Checkout failed'
            )
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