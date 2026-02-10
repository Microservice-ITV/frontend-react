// Sync cart across tabs (Senior level refactor)
import type { AppDispatch } from './store'
import { syncCart } from '@/features/cart/store/cartSlice'
import { loadCart } from '@/features/cart/utils/cartStorage'

// Prevent duplicate listeners (StrictMode): In React 18, StrictMode mounts twice in development
let initialized = false

export const initCartSync = (dispatch: AppDispatch) => {
    if (typeof window === 'undefined' || initialized) return
    initialized = true

    // INITIAL HYDRATION
    const cart = loadCart()
    if (cart) {
        dispatch(syncCart(cart))
    }

    // CROSS-TAB SYNC
    window.addEventListener('storage', (e) => {
        if (e.key !== 'dni_cart') return

        const cart = loadCart()
        if (cart) {
            dispatch(syncCart(cart))
        }
    })
}