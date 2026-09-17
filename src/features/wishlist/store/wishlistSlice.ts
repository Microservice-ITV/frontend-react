import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { WishlistItem, WishlistState } from '../types/wishlistTypes'

const initialState: WishlistState = {
    items: [],
}

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState,
    reducers: {
        addToWishlist(state, action: PayloadAction<string>) {
            const productId = action.payload.trim()
            if (!productId) return
            if (!state.items.some((i) => i.productId === productId)) {
                state.items.push({ productId })
            }
        },

        removeFromWishlist(state, action: PayloadAction<string>) {
            const productId = action.payload.trim()
            if (!productId) return
            state.items = state.items.filter((i) => i.productId !== productId)
        },

        toggleWishlist(state, action: PayloadAction<string>) {
            const productId = action.payload.trim()
            if (!productId) return
            const existing = state.items.find((i) => i.productId === productId)
            if (existing) {
                state.items = state.items.filter((i) => i.productId !== productId)
            } else {
                state.items.push({ productId })
            }
        },

        syncWishlist(state, action: PayloadAction<WishlistItem[]>) {
            if (!Array.isArray(action.payload)) {
                console.warn('Invalid wishlist payload, ignoring', action.payload)
                return
            }

            const seen = new Set<string>()
            state.items = action.payload
                .filter(
                    (row) =>
                        row &&
                        typeof row.productId === 'string' &&
                        row.productId.trim() !== '',
                )
                .filter((row) => {
                    const id = row.productId.trim()
                    if (seen.has(id)) return false
                    seen.add(id)
                    return true
                })
                .map((row) => ({ productId: row.productId.trim() }))
        },

        clearWishlist(state) {
            state.items = []
        },
    },
})

export const {
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    syncWishlist,
    clearWishlist,
} = wishlistSlice.actions

export default wishlistSlice.reducer