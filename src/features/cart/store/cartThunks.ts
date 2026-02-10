import { createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { clearCart } from './cartSlice'
import { orderService } from '@/services/orderService'

export const checkoutCart = createAsyncThunk<
    void,
    void,
    { state: RootState; rejectValue: string }
>(
    'cart/checkout',
    async (_, { getState, dispatch, rejectWithValue }) => {
        const { items } = getState().cart

        if (items.length === 0) {
            return rejectWithValue('Cart is empty')
        }

        try {
            await orderService.createCheckoutSession({
                items: items.map(item => ({
                    product_id: item.productId,
                    quantity: item.quantity,
                })),
            })

            // After this point, order-service owns everything
            dispatch(clearCart())
        } catch {
            return rejectWithValue('Checkout failed')
        }
    }
)