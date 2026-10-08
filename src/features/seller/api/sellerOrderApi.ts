import { authClient } from '@/lib/api/authClient'
import { accountingClient } from '@/lib/api/accountingClient'
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

/** Per-shop financial breakdown from order-service shop_orders attribution. */
export type SellerShopBreakdown = {
  shopOrderId: string
  shopId: string
  subtotal: number
  discount: number
  bundleDiscount?: number
  shipping: number
  total: number
  currency: string
  /** Per-shop fulfillment progress: READY_FOR_FULFILLMENT, SHIPPED... */
  status?: string | null
  trackingNumber?: string | null
  courierName?: string | null
  shippedAt?: string | null
}

/** A promotion discount attributed to one shop (quote-time allocation). */
export type SellerOrderPromotion = {
  promotionId: string
  rewardId: string
  promotionName: string
  shopId: string
  discountType: 'ITEM' | 'SHIPPING' | string
  fundedBy: 'SELLER' | 'PLATFORM' | string
  amount: number
}

export type SellerOrderTotals = {
  subtotal: number
  discount: number
  bundleDiscount: number
  shipping: number
  total: number
  currency: string
}

export type SellerOrderPayment = {
  status: string
  transactionId: string
  method?: string
  failedReason: string
}

export type PaymentRecord = {
  id: string
  orderId: string
  invoiceNo?: string | null
  amount: number
  currency: string
  status: string
  provider: string
  paymentMethod?: string | null
  createdAt: string
  updatedAt: string
  deliveryStatus?: string | null
  deliveryStatusId?: number | null
  /** Fulfillment status aggregated over THIS seller's shops in the order. */
  sellerDeliveryStatus?: string | null
  /** Seller-scoped money split from payment_allocations; null when unknown. */
  seller?: PaymentSellerShare | null
}

/** Owned amounts (seller's shops only) for one payment record. */
export type PaymentSellerShare = {
  /** Σ shop grand totals for the seller's shops. */
  orderShare: number
  /** Σ net payout after platform fees. */
  payout: number
  platformFee: number
  discountShare: number
  shippingShare: number
  shopCount: number
}

export type PaymentDetailEvent = {
  id: string
  type: string
  providerEventId?: string | null
  eventId?: string | null
  payload?: unknown
  createdAt: string
}

export type PaymentDetailOrder = {
  orderId: string
  checkoutId: string
  paymentId: string | null
  reservationId: string | null
  orderStatusId: number
  orderStatus: string
  trackingNumber?: string | null
  trackingUrl?: string | null
  courierCode?: string | null
  courierName?: string | null
  shipmentCreatedAt?: string | null
}

export type PaymentDetail = PaymentRecord & {
  checkoutId: string
  reservationId?: string | null
  failureReason?: string | null
  gatewayPaymentId?: string | null
  gatewayStatus?: string | null
  correlationId?: string | null
  expiresAt?: string | null
  clientSecret?: string | null
  events: PaymentDetailEvent[]
  order?: PaymentDetailOrder | null
}

export type SellerDelivery = {
  deliveryId: string
  deliveryNumber?: string
  status: string
  trackingNumber?: string | null
  trackingUrl?: string | null
  estimatedDeliveryDate?: string | null
  courier?: { code?: string; name?: string; phone?: string } | null
  items?: Array<{ productId?: string; shopId?: string | null }> | null
}

export type SellerOrderFulfillment = {
  status: string
  deliveries: SellerDelivery[]
}

/** Per-shop payout split recorded by payment-service for this order's payment. */
export type PaymentAllocation = {
  id: string
  paymentId: string
  shopOrderId: string | null
  shopId: string
  orderAmount: number
  discountShare: number
  shippingShare: number
  platformFee: number
  sellerAmount: number
}

export type SellerOrder = {
  orderId: string
  customerId: string
  status: string
  createdAt?: string | null
  placedAt?: string | null
  items: SellerOrderItem[]
  totals: SellerOrderTotals
  /** Empty for orders projected before per-shop attribution existed. */
  shopBreakdown?: SellerShopBreakdown[]
  promotions?: SellerOrderPromotion[]
  /** Totals summed over the seller's own shops (shopOrders views only). */
  sellerTotals?: SellerOrderTotals | null
  /** True when this order was fetched through the seller-scoped resolver. */
  scopedToSeller?: boolean
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

/**
 * Seller-visible fulfillment status for an order: derived from the seller's
 * own shops' shop_order statuses when the read model provides them, falling
 * back to the order-level status.
 *
 * Multi-owner orders: the order-level status can lag (PARTIALLY_FULFILLED /
 * CONFIRMED) while this seller's shop is ready to ship — the per-shop rows
 * are the source of truth for the seller's actions.
 */
export const sellerOrderStatus = (order: SellerOrder): string => {
  const rows = (order.shopBreakdown ?? []).filter((row) => row.status)
  if (rows.length > 0) {
    const statuses = rows.map((row) => (row.status || '').toUpperCase())
    const shippedLike = ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'FULFILLED']
    if (statuses.every((s) => shippedLike.includes(s))) {
      return 'SHIPPED'
    }
    if (statuses.some((s) => shippedLike.includes(s))) {
      return 'PARTIALLY_FULFILLED'
    }
    return statuses[0]
  }
  return (order.status || '').toUpperCase()
}

/** True when this seller's shops still have unshipped portions of the order. */
export const canSellerShip = (order: SellerOrder): boolean => {
  const rows = order.shopBreakdown ?? []
  if (rows.length > 0) {
    return rows.some((row) => (row.status || '').toUpperCase() === 'READY_FOR_FULFILLMENT')
  }
  return (order.status || '').toUpperCase() === 'READY_FOR_FULFILLMENT'
}

export async function fetchCustomerAvatars(
  ids: Array<string | null | undefined>,
): Promise<Record<string, string | null>> {
  const unique = [...new Set(ids.map((id) => (id ?? '').trim()).filter(Boolean))]
  const avatars: Record<string, string | null> = {}
  if (unique.length === 0) return avatars

  for (let index = 0; index < unique.length; index += 50) {
    const chunk = unique.slice(index, index + 50)
    const response = await authClient.get<{
      data?: { users?: Array<{ id: string; profile_image?: string | null }> }
    }>('/users/avatars', { params: { ids: chunk.join(',') } })

    for (const user of response.data.data?.users ?? []) {
      avatars[user.id] = user.profile_image || null
    }
  }

  return avatars
}

const SHOP_ORDERS_QUERY = `
  query ShopOrders($shopId: ID!, $userId: ID) {
    shopOrders(shopId: $shopId, userId: $userId) {
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
        discount
        bundleDiscount
        shipping
        total
        currency
      }
      scopedToSeller
      sellerTotals {
        subtotal
        discount
        bundleDiscount
        shipping
        total
        currency
      }
      shopBreakdown {
        shopOrderId
        shopId
        subtotal
        discount
        bundleDiscount
        shipping
        total
        currency
        status
        trackingNumber
        courierName
        shippedAt
      }
      promotions {
        promotionId
        rewardId
        promotionName
        shopId
        discountType
        fundedBy
        amount
      }
      payment {
        status
        transactionId
        method
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
          items {
            productId
            shopId
          }
        }
      }
      deliveryAddress {
        recipientName
        recipientPhone
        email
        country
        state
        city
        district
        ward
        addressLine1
        addressLine2
        postalCode
        deliveryNote
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

export type SellerDeliveryProvider = {
  code: string
  name: string
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
    shopIds.map((shopId) => sellerOrderApi.shopOrders(shopId, userId ?? undefined).catch(() => [] as SellerOrder[])),
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
  async listDeliveryProviders(): Promise<SellerDeliveryProvider[]> {
    const response = await accountingClient.get<{ providers?: SellerDeliveryProvider[] }>(
      '/delivery-providers',
    )
    if (!Array.isArray(response.data.providers)) {
      throw new Error('Accounting Service returned an invalid delivery provider list.')
    }
    return response.data.providers
  },

  async listShopsByUser(userId: string): Promise<OwnedShop[]> {
    const response = await productClient.get<{ success?: boolean; data?: OwnedShop[] }>(
      `/shops/user/${userId}`,
    )
    return response.data.data ?? []
  },

  async shopOrders(shopId: string, userId?: string): Promise<SellerOrder[]> {
    const response = await ecommerceReadClient.post<ShopOrdersResponse>('', {
      query: SHOP_ORDERS_QUERY,
      variables: { shopId, userId },
    })

    if (response.data.errors?.length) {
      throw new Error(response.data.errors[0]?.message ?? 'Failed to fetch shop orders')
    }

    return response.data.data?.shopOrders ?? []
  },

  /**
   * Per-shop payment allocations for an order, restricted to the given shops
   * (pass only the seller's own shop ids). Returns [] while unpaid/COD before
   * collection or when the endpoint is unavailable.
   */
  async paymentAllocations(orderId: string, shopIds: string[]): Promise<PaymentAllocation[]> {
    const response = await orderClient.get<{ data?: PaymentAllocation[] }>(
      `/orders/${orderId}/payment-allocations`,
      { params: shopIds.length > 0 ? { shop_ids: shopIds.join(',') } : undefined },
    )
    return response.data.data ?? []
  },

  async createShipment(
    orderId: string,
    payload: {
      courier_code: string
      courier_name: string
      courier_phone: string
      tracking_number?: string
      tracking_url?: string
      /** Ship only this shop's portion (multi-owner order, per-shop fulfillment). */
      shop_id?: string
    },
  ): Promise<{
    order_id: string
    order_status?: string
    status?: string
    tracking_number?: string
    tracking_url?: string
    courier: { code: string; name: string; phone: string }
  }> {
    const response = await orderClient.post(`/orders/${orderId}/create-shipment`, payload)
    return response.data
  },

  async collectPayment(orderId: string): Promise<{ order_id: string; payment_id: string; status: string }> {
    const response = await orderClient.post(`/orders/${orderId}/collect-payment`)
    return response.data
  },

  async paymentRecords(orderIds: string[]): Promise<PaymentRecord[]> {
    if (orderIds.length === 0) return []
    const chunks = Array.from({ length: Math.ceil(orderIds.length / 200) }, (_, index) =>
      orderIds.slice(index * 200, index * 200 + 200),
    )
    const responses = await Promise.all(chunks.map((orderIdsChunk) =>
      orderClient.get<{ data: PaymentRecord[] }>('/orders/payments', {
        params: { order_ids: orderIdsChunk.join(',') },
      }),
    ))
    return responses.flatMap((response) => response.data.data ?? [])
  },

  async paymentRecordsForShops(shopIds: string[]): Promise<PaymentRecord[]> {
    const uniqueShopIds = [...new Set(shopIds.filter(Boolean))]
    if (uniqueShopIds.length === 0) return []
    const responses = await Promise.all(
      Array.from({ length: Math.ceil(uniqueShopIds.length / 50) }, (_, index) =>
        orderClient.get<{ data: PaymentRecord[] }>('/orders/payments', {
          params: { shop_ids: uniqueShopIds.slice(index * 50, index * 50 + 50).join(',') },
        }),
      ),
    )
    // An order spanning shops that fall into different chunks is returned by
    // more than one request, so de-duplicate the merged payment records by id.
    const byId = new Map<string, PaymentRecord>()
    for (const record of responses.flatMap((response) => response.data.data ?? [])) {
      const key = record.id || record.orderId
      if (key && !byId.has(key)) byId.set(key, record)
    }
    return [...byId.values()]
  },

  async paymentDetail(paymentId: string): Promise<PaymentDetail> {
    const response = await orderClient.get<{ data: PaymentDetail }>(
      `/orders/payments/${paymentId}`,
    )
    return response.data.data
  },
}
