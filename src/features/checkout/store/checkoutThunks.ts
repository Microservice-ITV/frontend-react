import { createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { orderService } from '@/services/orderService'
import { CheckoutResponse } from '../types/checkoutTypes';

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
            // const idempotencyKey = crypto.randomUUID()
            const idempotencyKey = `${userId}-${JSON.stringify(selectedItems)}`

            const response = await orderService.createCheckoutSession({
                idempotency_key: idempotencyKey,
                user_id: String(userId),
                items: selectedItems.map(item => ({
                    product_id: item.productId,
                    qty: item.quantity,
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