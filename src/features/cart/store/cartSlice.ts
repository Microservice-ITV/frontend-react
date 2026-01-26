import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { CartItem, CartState } from '../types/cartTypes'
import { loadCart, saveCart } from '../utils/cartStorage'

const initialState: CartState = {
    items: loadCart(),
}

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart(
            state,
            action: PayloadAction<CartItem>
        ) {
            const existing = state.items.find(
                i => i.productId === action.payload.productId
            )

            if (existing) {
                existing.quantity = Math.min(
                    existing.quantity += action.payload.quantity,
                    99
                )
            } else {
                state.items.push({
                    ...action.payload,
                    quantity: Math.min(action.payload.quantity, 99),
                })
            }

            saveCart(state.items)
        },

        removeFromCart(state, action: PayloadAction<string>) {
            state.items = state.items.filter(
                i => i.productId !== action.payload
            )
            saveCart(state.items)
        },

        updateQuantity(
            state,
            action: PayloadAction<{ productId: string; quantity: number }>
        ) {
            const item = state.items.find(
                i => i.productId === action.payload.productId
            )
            if (!item) return

            // Remove item if qty <= 0
            if (action.payload.quantity <= 0) {
                state.items = state.items.filter(
                    i => i.productId !== action.payload.productId
                )
            }
            // Cap quantity
            else {
                // Set quantity (with cap)
                item.quantity = Math.min(action.payload.quantity, 99)
            }

            saveCart(state.items)
        },

        syncCart(state, action: PayloadAction<CartItem[]>) {
            state.items = action.payload
        },

        clearCart(state) {
            state.items = []
            saveCart([])
        },
    },
})

export const {
    addToCart,
    removeFromCart,
    updateQuantity,
    syncCart,
    clearCart,
} = cartSlice.actions

export default cartSlice.reducer