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

    async getCheckoutSession(checkoutId: string) {
        try {
            return await orderApi.get(`/orders/checkout-sessions/${checkoutId}`)
        } catch (error: any) {
            // Fallbacks for alternate route shapes used by other environments.
            if (error?.response?.status === 404) {
                try {
                    return await orderApi.get(`/orders/checkout/${checkoutId}/status`)
                } catch (innerError: any) {
                    if (innerError?.response?.status === 404) {
                        return orderApi.get(`/checkouts/${checkoutId}/status`)
                    }
                    throw innerError
                }
            }
            throw error
        }
    },
}