import { productClient } from '@/lib/api/productClient'
import type { CartItem } from '../types/cartTypes'

interface ReminderActivityItem {
    productId: string
    variantId?: string
    name?: string
    image?: string
    price?: number
    quantity?: number
}

const toActivityItem = (item: CartItem): ReminderActivityItem => ({
    productId: item.productId,
    variantId: item.variantId || undefined,
    name: item.name,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
})

/**
 * Best-effort telemetry: tells product-service when the cart was last touched so
 * the abandoned-cart reminder scheduler knows when the user goes inactive. The
 * backend derives the user from the JWT (auth interceptor attaches the Bearer
 * token), so no user id is sent. The item snapshot powers the reminder email
 * because the cart itself lives only in localStorage.
 */
export const recordCartActivity = async (items: CartItem[]): Promise<void> => {
    await productClient.post('/reminders/activity', {
        source: 'CART',
        items: items.map(toActivityItem),
    })
}
