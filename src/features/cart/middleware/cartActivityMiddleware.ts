import type { Middleware } from '@reduxjs/toolkit'
import { recordCartActivity } from '../api/cartActivityApi'
import type { CartItem } from '../types/cartTypes'

// Only these slice reducers represent a real user intent to change the cart.
// Hydration (`syncCart`) and selection toggles must NOT report activity, so a
// page refresh or a checkbox click doesn't reset the inactivity timer.
const MUTATION_ACTION_TYPES = new Set([
    'cart/addToCart',
    'cart/updateQuantity',
    'cart/removeFromCart',
    'cart/removeSelectedItems',
    'cart/clearCart',
])

/**
 * Fire-and-forget reporter for the abandoned-cart reminder scheduler. The cart
 * lives in the browser, so the server can only learn about cart activity from
 * here. Must never affect the cart UX, hence `void` + swallow errors.
 */
export const cartActivityMiddleware: Middleware =
    store => next => action => {
        // Let reducers process the action first
        const result = next(action)

        const state = store.getState() as {
            auth: { user?: { id?: string } | null }
            cart: { items: CartItem[] }
        }

        // Reminders need a logged-in user (and their email comes from the JWT).
        if (!state.auth.user?.id) {
            return result
        }

        if (!MUTATION_ACTION_TYPES.has((action as { type?: string }).type ?? '')) {
            return result
        }

        void recordCartActivity(state.cart.items).catch(() => {
            // Best-effort; the next cart action will report again.
        })

        return result
    }
