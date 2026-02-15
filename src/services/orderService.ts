import { orderApi } from '@/lib/api/orderApi'

export const orderService = {
    createCheckoutSession(data: {
        user_id: string
        items: { product_id: string; qty: number }[]
        idempotency_key: string
    }) {
        return orderApi.post('/orders/checkout', data, {
            headers: {
                'Idempotency-Key': data.idempotency_key,
            },
        })
    },

    getOrders() {
        return orderApi.get('/')
    },
}