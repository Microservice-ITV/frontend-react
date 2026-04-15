import { shippingClient } from '@/lib/api/shippingClient'
import type { CartItem } from '@/features/cart/types/cartTypes'
import type { UserAddress } from '@/features/account/types/addressTypes'

export type BatchShopProfilesRequest = {
    shopIds: string[]
}

export type CalculateShippingShopPayload = {
    shopId: string
    items: Array<{
        productId: string
        variantId?: string
        quantity: number
    }>
}

export type CalculateShippingRequest = {
    deliveryAddress: {
        city: string
        district: string
        lat: number
        lng: number
    }
    shops: CalculateShippingShopPayload[]
    /** e.g. STANDARD — default for checkout */
    methodCode: string
}

export function buildCalculatePayload(
    address: UserAddress,
    items: CartItem[],
): CalculateShippingRequest {
    const byShop = new Map<string, CartItem[]>()
    for (const item of items) {
        const list = byShop.get(item.shopId) ?? []
        list.push(item)
        byShop.set(item.shopId, list)
    }

    const shops: CalculateShippingShopPayload[] = []
    for (const [shopId, rows] of byShop) {
        shops.push({
            shopId,
            items: rows.map((i) => ({
                productId: i.productId,
                variantId: i.variantId || undefined,
                quantity: i.quantity,
            })),
        })
    }

    return {
        deliveryAddress: {
            city: address.city ?? '',
            district: address.district ?? '',
            lat: address.latitude ?? 0,
            lng: address.longitude ?? 0,
        },
        shops,
        methodCode: 'STANDARD',
    }
}

export const shippingApi = {
    batchShopProfiles(shopIds: string[]) {
        const unique = [...new Set(shopIds.map((id) => id.trim()).filter(Boolean))]
        return shippingClient.post<unknown>('/shipping/shop-profiles/batch', { shopIds: unique })
    },

    calculateShipping(payload: CalculateShippingRequest) {
        return shippingClient.post<unknown>('/shipping/calculate', payload)
    },
}