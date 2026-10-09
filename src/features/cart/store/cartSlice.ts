import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { CartItem, CartState } from '../types/cartTypes'
import { limitToDetailStock } from '@/features/products/components/ProductQuantityInput'
import { normalizeVariantId, sameCartLine } from './cartLine'

function normalizeIncomingItem(payload: CartItem): CartItem {
    const toPositive = (value: unknown): number | null => {
        if (value == null || value === '') return null
        const n = typeof value === 'number' ? value : Number(String(value).trim())
        return Number.isFinite(n) && n > 0 ? n : null
    }

    const stock = payload.availableStock
    const availableStock = stock == null || !Number.isFinite(Number(stock))
        ? undefined
        : Math.max(0, Math.floor(Number(stock)))

    return {
        ...payload,
        variantId: normalizeVariantId(payload.variantId),
        availableStock,
        weightKg: toPositive(payload.weightKg),
        lengthCm: toPositive(payload.lengthCm),
        widthCm: toPositive(payload.widthCm),
        heightCm: toPositive(payload.heightCm),
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
                if (payload.availableStock != null) existing.availableStock = payload.availableStock
                existing.quantity = limitToDetailStock(
                    existing.quantity + payload.quantity,
                    existing.availableStock,
                )
                if (payload.variantLabel) existing.variantLabel = payload.variantLabel
                // Refresh parcel data so shipping uses the latest product weight/dims.
                if (payload.weightKg != null) existing.weightKg = payload.weightKg
                if (payload.lengthCm != null) existing.lengthCm = payload.lengthCm
                if (payload.widthCm != null) existing.widthCm = payload.widthCm
                if (payload.heightCm != null) existing.heightCm = payload.heightCm
                if (payload.categoryId) existing.categoryId = payload.categoryId
                if (payload.shopId && payload.shopId !== 'unknown') existing.shopId = payload.shopId
                if (payload.shopName && payload.shopName !== 'Seller store') {
                    existing.shopName = payload.shopName
                }
            } else {
                const quantity = limitToDetailStock(payload.quantity, payload.availableStock)
                if (quantity <= 0) return
                state.items.push({
                    ...payload,
                    quantity,
                    selected: payload.selected ?? false,
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
                item.quantity = limitToDetailStock(action.payload.quantity, item.availableStock)
            }
        },

        setItemAvailableStock(
            state,
            action: PayloadAction<{ productId: string; variantId?: string; availableStock: number }>
        ) {
            const vid = normalizeVariantId(action.payload.variantId)
            const item = state.items.find(
                i => i.productId === action.payload.productId && normalizeVariantId(i.variantId) === vid
            )
            if (!item) return

            const availableStock = Math.max(0, Math.floor(action.payload.availableStock))
            const quantity = limitToDetailStock(item.quantity, availableStock)
            if (item.availableStock === availableStock && item.quantity === quantity) return

            item.availableStock = availableStock
            if (quantity <= 0) {
                state.items = state.items.filter(
                    i => !(i.productId === action.payload.productId && normalizeVariantId(i.variantId) === vid)
                )
                return
            }
            item.quantity = quantity
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
        setItemShop(
            state,
            action: PayloadAction<{
                productId: string
                variantId?: string
                shopId: string
                shopName: string
            }>
        ) {
            const vid = normalizeVariantId(action.payload.variantId)
            const item = state.items.find(
                i => i.productId === action.payload.productId && normalizeVariantId(i.variantId) === vid
            )
            if (!item) return
            item.shopId = action.payload.shopId
            item.shopName = action.payload.shopName
        },
    },
})

export const {
    addToCart,
    updateQuantity,
    setItemAvailableStock,
    removeFromCart,
    removeSelectedItems,
    clearCart,
    syncCart,
    toggleItemSelection,
    toggleShopSelection,
    toggleAllSelection,
    setItemShop,
} = cartSlice.actions

export default cartSlice.reducer