import type { Middleware } from '@reduxjs/toolkit'
import { saveUserWishlist, saveAnonWishlist } from '../utils/wishlistStorage'

// Signature of the last wishlist saved against the user key. Used to detect the
// logout moment, when auth has been cleared but wishlist still shows the user's
// items — we must not flush those into the anonymous/guest list.
let lastUserSignature: string | null = null

// Wishlist persistence middleware
// Runs after every dispatched action.
// Wishlist is scoped to the current browser and keyed by auth:
//  - authenticated → `dni_wishlist` (user-scoped cache)
//  - guest        → `dni_wishlist_anon`
// The wipe happens only when the guest list genuinely belongs to the guest, so a
// logout (or session expiry) can never overwrite the guest's items with the
// previous user's wishlist.
export const wishlistPersistenceMiddleware: Middleware =
    store => next => action => {
        // Let reducers process the action first
        const result = next(action)

        // After reducers run, persist wishlist
        const state = store.getState() as {
            auth: { initialized: boolean; user?: { id?: string } | null }
            wishlist: { items: { productId: string }[] }
        }
        const items = state.wishlist.items ?? []
        const userId = state.auth.user?.id

        if (userId) {
            lastUserSignature = signatureOf(items)
            saveUserWishlist(items)
            return result
        }

        // Not authenticated.
        // 1) Auth bootstrap hasn't resolved yet (initial page load) — the items
        //    here may be a cached user list, so don't touch the guest key.
        // 2) The wishlist still matches the last user list (logout flush) — skip,
        //    so the guest's stored list survives until restoreGuestWishlist runs.
        if (!state.auth.initialized || signatureOf(items) === lastUserSignature) {
            return result
        }

        saveAnonWishlist(items)
        return result
    }

const signatureOf = (items: { productId: string }[]): string =>
    items
        .map(i => i.productId)
        .sort()
        .join(',')