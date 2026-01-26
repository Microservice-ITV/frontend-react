import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './rootReducer'

import { syncCart } from '@/features/cart/store/cartSlice'
import { loadCart } from '@/features/cart/utils/cartStorage'

export const store = configureStore({
    reducer: rootReducer
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// 🔁 Sync cart across tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'dni_cart') {
        store.dispatch(syncCart(loadCart()))
    }
})