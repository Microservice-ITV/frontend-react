import { RootState } from '@/app/store'

export const selectCartItems = (state: RootState) => state.cart.items

export const selectCartCount = (state: RootState) =>
    state.cart.items.reduce((sum, i) => sum + i.quantity, 0)

export const selectCartTotal = (state: RootState) =>
    state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)