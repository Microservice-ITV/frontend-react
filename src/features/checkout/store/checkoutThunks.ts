import { createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { checkoutApi } from '../api/checkoutApi'
import type { CheckoutResponse, CheckoutStatusResponse } from '../types/checkoutTypes';

const generateIdempotencyKey = (userId: string) => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID()
    }
    return `checkout-${userId}-${Date.now()}`
}

export const checkoutCart = createAsyncThunk<
    CheckoutResponse,
    void,
    { state: RootState; rejectValue: string }
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

            const response = await checkoutApi.createCheckoutSession({
                idempotency_key: idempotencyKey,
                user_id: String(userId),
                items: selectedItems.map(item => ({
                    product_id: item.productId,
                    qty: item.quantity,
                    ...(item.variantId ? { variant_id: item.variantId } : {}),
                })),
            })

            return response.data
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

export const fetchCheckoutStatus = createAsyncThunk<
    CheckoutStatusResponse,
    string,
    { rejectValue: string }
>(
    'checkout/fetchStatus',
    async (checkoutId, { rejectWithValue }) => {
        try {
            const response = await checkoutApi.getCheckoutSession(checkoutId)
            const payload = response.data as CheckoutStatusResponse & {
                payment?: { client_secret?: string }
            }

            return {
                checkout_id: payload.checkout_id ?? checkoutId,
                status: payload.status ?? 'PROCESSING',
                client_secret: payload.client_secret ?? payload.payment?.client_secret,
                expire_at: payload.expire_at ?? null,
                message: payload.message,
            }
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.error ?? 'Failed to fetch checkout status'
            )
        }
    }
)