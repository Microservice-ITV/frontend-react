import { orderApi } from '@/lib/api/orderApi'

export const orderService = {
    createCheckoutSession(data: {
        items: { product_id: string; quantity: number }[]
    }) {
        return orderApi.post('/checkout', data)
    },

    getOrders() {
        return orderApi.get('/')
    },
}