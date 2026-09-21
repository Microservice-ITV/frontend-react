import { ecommerceReadClient } from '@/lib/api/ecommerceReadClient'
import { orderClient } from '@/lib/api/orderClient'
import { productClient } from '@/lib/api/productClient'

export type SellerOrderItem = {
  productId: string
  variantId?: string | null
  sku: string
  name: string
  imageUrl: string
  quantity: number
  unitPrice: number
  lineTotal: number
  currency: string
  shopId: string
}

export type SellerOrderTotals = {
  subtotal: number
  total: number
  currency: string
}

export type SellerOrderPayment = {
  status: string
  transactionId: string
  failedReason: string
}

export type SellerDelivery = {
  deliveryId: string
  deliveryNumber?: string
  status: string
  trackingNumber?: string | null
  trackingUrl?: string | null
  estimatedDeliveryDate?: string | null
  courier?: { code?: string; name?: string; phone?: string } | null
}

export type SellerOrderFulfillment = {
  status: string
  deliveries: SellerDelivery[]
}

export type SellerOrder = {
  orderId: string
  customerId: string
  status: string
  createdAt?: string | null
  placedAt?: string | null
  items: SellerOrderItem[]
  totals: SellerOrderTotals
  payment: SellerOrderPayment
  fulfillment?: SellerOrderFulfillment | null
  deliveryAddress?: {
    recipientName?: string
    recipientPhone?: string
    email?: string
    country?: string
    state?: string
    city?: string
    district?: string
    ward?: string
    addressLine1?: string
    addressLine2?: string
    postalCode?: string
    deliveryNote?: string
  } | null
}

const SHOP_ORDERS_QUERY = `
  query ShopOrders($shopId: ID!) {
    shopOrders(shopId: $shopId) {
      orderId
      customerId
      status
      createdAt
      placedAt
      items {
        productId
        variantId
        sku
        name
        imageUrl
        quantity
        unitPrice
        lineTotal
        currency
        shopId
      }
      totals {
        subtotal
        total
        currency
      }
      payment {
        status
        transactionId
        failedReason
      }
      fulfillment {
        status
        deliveries {
          deliveryId
          deliveryNumber
          status
          trackingNumber
          trackingUrl
          estimatedDeliveryDate
          courier {
            code
            name
            phone
          }
        }
      }
      deliveryAddress {
        recipientName
        email
      }
    }
  }
`

type GraphQLError = { message?: string }

interface ShopOrdersResponse {
  data?: { shopOrders?: SellerOrder[] }
  errors?: GraphQLError[]
}

export type OwnedShop = {
  id?: string
  shopId?: string
  slug?: string
  name?: string
}

/**
 * Fetch all orders across every shop owned by the seller, merged and deduped.
 * Falls back to activeShopId when ownership lookup is unavailable.
 */
export async function fetchOrdersAcrossOwnedShops(
  userId?: string | null,
  activeShopId?: string | null,
): Promise<SellerOrder[]> {
  let shopIds: string[] = []

  if (userId) {
    try {
      const shops = await sellerOrderApi.listShopsByUser(userId)
      shopIds = shops
        .map((shop) => shop.id ?? shop.shopId ?? '')
        .filter((id): id is string => Boolean(id))
    } catch {
      // Best-effort ownership lookup; fall back below.
    }
  }

  if (shopIds.length === 0 && activeShopId) {
    shopIds = [activeShopId]
  }

  if (shopIds.length === 0) {
    return []
  }

  const results = await Promise.all(
    shopIds.map((shopId) => sellerOrderApi.shopOrders(shopId).catch(() => [] as SellerOrder[])),
  )

  const merged = new Map<string, SellerOrder>()
  for (const orders of results) {
    for (const order of orders) {
      if (!merged.has(order.orderId)) {
        merged.set(order.orderId, order)
      }
    }
  }

  return [...merged.values()].sort((a, b) => {
    const aTime = new Date(a.placedAt || a.createdAt || 0).getTime()
    const bTime = new Date(b.placedAt || b.createdAt || 0).getTime()
    return bTime - aTime
  })
}

export const sellerOrderApi = {
  async listShopsByUser(userId: string): Promise<OwnedShop[]> {
    const response = await productClient.get<{ success?: boolean; data?: OwnedShop[] }>(
      `/shops/user/${userId}`,
    )
    return response.data.data ?? []
  },

  async shopOrders(shopId: string): Promise<SellerOrder[]> {
    const response = await ecommerceReadClient.post<ShopOrdersResponse>('', {
      query: SHOP_ORDERS_QUERY,
      variables: { shopId },
    })

    if (response.data.errors?.length) {
      throw new Error(response.data.errors[0]?.message ?? 'Failed to fetch shop orders')
    }

    return response.data.data?.shopOrders ?? []
  },

  async createShipment(
    orderId: string,
    payload: {
      courier_code: string
      courier_name: string
      courier_phone: string
      tracking_number?: string
      tracking_url?: string
    },
  ): Promise<{
    order_id: string
    status: string
    tracking_number?: string
    tracking_url?: string
    courier: { code: string; name: string; phone: string }
  }> {
    const response = await orderClient.post(`/orders/${orderId}/create-shipment`, payload)
    return response.data
  },
}
