import type { CartItem } from '../types/cartTypes'

const CART_KEY = 'dni_cart'

export const loadCart = (): CartItem[] => {
    try {
        const raw = localStorage.getItem(CART_KEY)
        if (!raw) return []

        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

export const saveCart = (items: CartItem[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
}