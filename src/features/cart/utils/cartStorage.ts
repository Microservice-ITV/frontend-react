const CART_KEY = 'dni_cart'

export const loadCart = () => {
    try {
        const raw = localStorage.getItem(CART_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

export const saveCart = (items: any[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
}
