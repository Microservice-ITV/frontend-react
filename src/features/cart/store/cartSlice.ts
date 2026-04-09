import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { CartItem, CartState } from '../types/cartTypes'
import { normalizeVariantId, sameCartLine } from './cartLine'

function normalizeIncomingItem(payload: CartItem): CartItem {
    return {
        ...payload,
        variantId: normalizeVariantId(payload.variantId),
    }
}

const initialState: CartState = {
    items: [],
}

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart(state, action: PayloadAction<CartItem>) {
            const payload = normalizeIncomingItem(action.payload)
            const existing = state.items.find(i => sameCartLine(i, payload))

            if (existing) {
                existing.quantity = Math.min(existing.quantity + payload.quantity, 99)
                if (payload.variantLabel) existing.variantLabel = payload.variantLabel
            } else {
                state.items.push({
                    ...payload,
                    quantity: Math.min(payload.quantity, 99),
                    selected: false,
                })
            }
        },

        updateQuantity(
            state,
            action: PayloadAction<{ productId: string; variantId?: string; quantity: number }>
        ) {
            const vid = normalizeVariantId(action.payload.variantId)
            const item = state.items.find(
                i => i.productId === action.payload.productId && normalizeVariantId(i.variantId) === vid
            )
            if (!item) return

            if (action.payload.quantity <= 0) {
                state.items = state.items.filter(
                    i => !(i.productId === action.payload.productId && normalizeVariantId(i.variantId) === vid)
                )
            } else {
                item.quantity = Math.min(action.payload.quantity, 99)
            }
        },

        removeFromCart(state, action: PayloadAction<{ productId: string; variantId?: string }>) {
            const vid = normalizeVariantId(action.payload.variantId)
            state.items = state.items.filter(
                i => !(i.productId === action.payload.productId && normalizeVariantId(i.variantId) === vid)
            )
        },

        // DELETE SELECTED ITEMS (checkout footer "Delete")
        removeSelectedItems(state) {
            state.items = state.items.filter(item => !item.selected)
        },

        // DELETE ALL ITEMS (danger action / logout / reset)
        clearCart(state) {
            state.items = []
        },

        syncCart(state, action: PayloadAction<CartItem[]>) {
            // Defensive: ignore corrupted storage
            if (!Array.isArray(action.payload)) {
                console.warn('Invalid cart payload, ignoring', action.payload)
                return
            }
            state.items = action.payload.map(i => normalizeIncomingItem({ ...i, variantId: i.variantId ?? '' }))
        },

        // CART CHECKBOXES
        // Toggle a single item
        toggleItemSelection(
            state,
            action: PayloadAction<{ productId: string; variantId?: string }>
        ) {
            const vid = normalizeVariantId(action.payload.variantId)
            const item = state.items.find(
                i => i.productId === action.payload.productId && normalizeVariantId(i.variantId) === vid
            )
            if (item) item.selected = !item.selected
        },
        // Toggle a whole shop
        toggleShopSelection(
            state,
            action: PayloadAction<{ shopId: string; selected: boolean }>
        ) {
            state.items.forEach(item => {
                if (item.shopId === action.payload.shopId) {
                    item.selected = action.payload.selected
                }
            })
        },
        // Toggle ALL (header & summary)
        toggleAllSelection(
            state,
            action: PayloadAction<boolean>
        ) {
            state.items.forEach(item => {
                item.selected = action.payload
            })
        },
    },
})

export const {
    addToCart,
    updateQuantity,
    removeFromCart,
    removeSelectedItems,
    clearCart,
    syncCart,
    toggleItemSelection,
    toggleShopSelection,
    toggleAllSelection,
} = cartSlice.actions

export default cartSlice.reducer