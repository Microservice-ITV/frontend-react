import type { Middleware } from '@reduxjs/toolkit'
import { saveCart } from '../utils/cartStorage'

// Cart persistence middleware
// Runs after every dispatched action
// Responsible for syncing cart state to localStorage
// Keeps reducers pure and avoids UI-based persistence logic
export const cartPersistenceMiddleware: Middleware =
    store => next => action => {
        // Let reducers process the action first
        const result = next(action)

        // After reducers run, persist cart
        const state = store.getState() as any
        saveCart(state.cart.items)

        return result
    }