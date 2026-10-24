import { authClient } from '@/lib/api/authClient'
import { ecommerceReadClient } from '@/lib/api/ecommerceReadClient'
import { orderClient } from '@/lib/api/orderClient'

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
  wayBillNo?: string | null
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
  deliveryShopId?: string | null
  deliveryCompanyId?: string | null
  codCollectionBatchId?: string | null
  /** Seller-scoped money split from payment_allocations; null when unknown. */
  seller?: PaymentSellerShare | null
}

/** COD amounts awaiting remittance for a seller's already-delivered orders. */
export const isDeliveredPendingCodPayment = (payment: PaymentRecord): boolean =>
  payment.provider.trim().toLowerCase() === 'cod'
  && payment.status.trim().toUpperCase() === 'PENDING'
  && (payment.sellerDeliveryStatus ?? payment.deliveryStatus)?.trim().toUpperCase() === 'DELIVERED'

/** Prefer the seller's net payout allocation; legacy rows fall back to payment amount. */
export const sellerPaymentAmountDue = (payment: PaymentRecord): number => {
  const amount = Number(payment.seller?.payout ?? payment.amount)
  return Number.isFinite(amount) ? amount : 0
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
  wayBillNo?: string | null
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
  wayBillNo?: string | null
  cancellationReason?: string | null
  cancelledAt?: string | null
  returnDeadlineAt?: string | null
  returnReason?: string | null
  returnedAt?: string | null
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

/** Lightweight fields used by the seller order table and dashboard summary. */
export type SellerOrderSummary = {
  orderId: string
  customerId: string
  status: string
  wayBillNo?: string | null
  createdAt?: string | null
  placedAt?: string | null
  items: Array<Pick<SellerOrderItem, 'productId' | 'name' | 'shopId'>>
  totals: Pick<SellerOrderTotals, 'total' | 'currency'>
  shopBreakdown?: Array<Pick<SellerShopBreakdown, 'shopId' | 'status'>>
  sellerTotals?: Pick<SellerOrderTotals, 'total' | 'currency'> | null
  scopedToSeller?: boolean
  deliveryAddress?: Pick<NonNullable<SellerOrder['deliveryAddress']>, 'recipientName' | 'city'> | null
}

type SellerOrderStatusInfo = {
  status: string
  shopBreakdown?: Array<{ status?: string | null }>
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
export const sellerOrderStatus = (order: SellerOrderStatusInfo): string => {
  const orderStatus = (order.status || '').toUpperCase()
  if (['DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED'].includes(orderStatus)) {
    return orderStatus
  }

  const rows = (order.shopBreakdown ?? []).filter((row) => row.status)
  if (rows.length > 0) {
    const statuses = rows.map((row) => (row.status || '').toUpperCase())
    const deliveredLike = ['DELIVERED', 'COMPLETED']
    if (statuses.every((status) => deliveredLike.includes(status))) {
      return statuses.includes('DELIVERED') ? 'DELIVERED' : 'COMPLETED'
    }
    const shippedLike = ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'FULFILLED']
    if (statuses.every((s) => shippedLike.includes(s))) {
      return 'SHIPPED'
    }
    if (statuses.some((s) => shippedLike.includes(s))) {
      return 'PARTIALLY_FULFILLED'
    }
    return statuses[0]
  }
  return orderStatus
}

/** True when this seller's shops still have unshipped portions of the order. */
export const canSellerShip = (order: SellerOrderStatusInfo): boolean => {
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

/**
 * Detail projection for one seller order: everything the order detail page
 * renders (payment, fulfillment/deliveries, promotions, full address).
 * Narrowed server-side by the `orderId` argument — never used for lists.
 */
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

/** List projection for the seller order table and dashboard. */
const SELLER_ORDER_SUMMARY_FIELDS = `
      orderId
      customerId
      status
      createdAt
      placedAt
      items {
        productId
        name
        shopId
      }
      totals {
        total
        currency
      }
      scopedToSeller
      sellerTotals {
        total
        currency
      }
      shopBreakdown {
        shopId
        status
      }
      deliveryAddress {
        recipientName
        city
      }
`

const SHOP_ORDER_SUMMARIES_QUERY = `
  query ShopOrderSummaries($shopId: ID!, $userId: ID) {
    shopOrders(shopId: $shopId, userId: $userId) {
${SELLER_ORDER_SUMMARY_FIELDS}
    }
  }
`

type GraphQLError = { message?: string }

interface ShopOrdersResponse {
  data?: { shopOrders?: SellerOrder[] }
  errors?: GraphQLError[]
}

interface ShopOrderSummariesResponse {
  data?: { shopOrders?: SellerOrderSummary[] }
  errors?: GraphQLError[]
}

export type SellerOrderStatusFilter = 'all' | 'to-ship' | 'shipped' | 'completed' | 'cancelled' | 'returned'

type SellerShop = { id: string; shopId: string; name: string; slug: string }
type SellerShopAccessResponse = {
  data?: {
    access_context?: {
      shops?: Array<{
        shop_id?: string | null
        shop_name?: string | null
        shop_domain?: string | null
        membership_status?: string | null
        role?: { code?: string | null } | null
      }>
    }
  }
}

const resolveSellerShopIds = async (
  _userId?: string | null,
  activeShopId?: string | null,
): Promise<string[]> => {
  // Shop access comes from the authenticated access context, not creator ID.
  return activeShopId ? [activeShopId] : []
}

/** Fetch compact summary fields for the seller order table and dashboard. */
export async function fetchSellerOrderSummariesAcrossOwnedShops(
  userId?: string | null,
  activeShopId?: string | null,
  statusFilter: SellerOrderStatusFilter = 'all',
  signal?: AbortSignal,
): Promise<SellerOrderSummary[]> {
  const shopIds = await resolveSellerShopIds(userId, activeShopId)
  if (shopIds.length === 0) return []

  // The resolver validates this active shop against the authenticated user's
  // active memberships and scopes the returned order rows to that shop.
  const orders = await sellerOrderApi.shopOrderSummaries(
    shopIds[0],
    userId ?? undefined,
    signal,
  )

  return orders
    .filter((order) => matchesSellerOrderFilter(order, statusFilter))
    .sort((a, b) => {
    const aTime = new Date(a.placedAt || a.createdAt || 0).getTime()
    const bTime = new Date(b.placedAt || b.createdAt || 0).getTime()
    return bTime - aTime
    })
}

const matchesSellerOrderFilter = (order: SellerOrderSummary, filter: SellerOrderStatusFilter): boolean => {
  if (filter === 'all') return true
  const status = sellerOrderStatus(order).toUpperCase()
  if (filter === 'to-ship') return canSellerShip(order)
  if (filter === 'shipped') return ['SHIPPED', 'PARTIALLY_FULFILLED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(status)
  if (filter === 'completed') return ['DELIVERED', 'COMPLETED'].includes(status)
  if (filter === 'cancelled') return status === 'CANCELLED'
  return status === 'RETURNED'
}

/** Fetch one full seller-scoped order instead of downloading the seller's history. */
export async function fetchSellerOrderByIdAcrossOwnedShops(
  orderId: string,
  userId?: string | null,
  activeShopId?: string | null,
): Promise<SellerOrder | null> {
  const shopIds = await resolveSellerShopIds(userId, activeShopId)
  if (shopIds.length === 0) return null

  const orders = await sellerOrderApi.shopOrders(
    shopIds[0],
    userId ?? undefined,
  )
  return orders.find((order) => order.orderId === orderId) ?? null
}

export type SellerOrderPage = {
  items: SellerOrderSummary[]
  total: number
  page: number
  limit: number
}

export async function fetchSellerOrderPage(
  params: { userId?: string; activeShopId?: string | null; statusFilter: SellerOrderStatusFilter; search: string; page: number; limit: number },
  signal?: AbortSignal,
): Promise<SellerOrderPage> {
  if (signal?.aborted) throw new DOMException('Request was aborted', 'AbortError')
  const orders = await fetchSellerOrderSummariesAcrossOwnedShops(
    params.userId,
    params.activeShopId,
    params.statusFilter,
    signal,
  )
  if (signal?.aborted) throw new DOMException('Request was aborted', 'AbortError')

  const term = params.search.trim().toLowerCase()
  const filtered = term
    ? orders.filter((order) => [
        order.orderId,
        order.wayBillNo,
        order.customerId,
        order.status,
        order.deliveryAddress?.recipientName,
        order.deliveryAddress?.city,
        ...order.items.map((item) => item.name),
      ].some((value) => value?.toLowerCase().includes(term)))
    : orders
  const page = Math.max(1, params.page)
  const limit = Math.max(1, params.limit)
  const offset = (page - 1) * limit
  return { items: filtered.slice(offset, offset + limit), total: filtered.length, page, limit }
}

export const sellerOrderApi = {
  /**
   * Backward-compatible shop lookup for seller pages. The authenticated
   * access context is authoritative; userId is retained for existing callers
   * but is never used to discover creator-owned shops.
   */
  async listShopsByUser(_userId: string): Promise<SellerShop[]> {
    const response = await authClient.get<SellerShopAccessResponse>('/me/access-context')
    return (response.data.data?.access_context?.shops ?? [])
      .filter((shop) =>
        shop.membership_status?.toLowerCase() === 'active'
        && ['shop_owner', 'shop_admin'].includes(shop.role?.code?.toLowerCase() ?? ''),
      )
      .flatMap((shop) => {
        const id = shop.shop_id?.trim()
        if (!id) return []
        return [{
          id,
          shopId: id,
          name: shop.shop_name?.trim() || id,
          slug: shop.shop_domain?.trim() || id,
        }]
      })
  },

  /**
   * Full detail projection of the seller's orders. Pass `orderId` to fetch a
   * single order (detail page); list views should use `shopOrderSummaries`.
   */
  async shopOrders(
    shopId: string,
    userId?: string,
  ): Promise<SellerOrder[]> {
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
   * Compact list projection (order id, waybill, customer, items, status,
   * total, date) for the seller order table and dashboard summary.
   */
  async shopOrderSummaries(
    shopId: string,
    userId?: string,
    signal?: AbortSignal,
  ): Promise<SellerOrderSummary[]> {
    const response = await ecommerceReadClient.post<ShopOrderSummariesResponse>('', {
      query: SHOP_ORDER_SUMMARIES_QUERY,
      variables: { shopId, userId },
    }, { signal })

    if (response.data.errors?.length) {
      throw new Error(response.data.errors[0]?.message ?? 'Failed to fetch seller order summaries')
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
      courier_code?: string
      courier_name?: string
      courier_phone?: string
      tracking_number?: string
      way_bill_no: string
      tracking_url?: string
      /** Ship only this shop's portion (multi-owner order, per-shop fulfillment). */
      shop_id?: string
    },
  ): Promise<{
    order_id: string
    order_status?: string
    status?: string
    tracking_number?: string
    way_bill_no: string
    tracking_url?: string
    courier: { code: string; name: string; phone: string }
  }> {
    const response = await orderClient.post(`/orders/${orderId}/create-shipment`, payload)
    return response.data
  },

  async cancelShippedOrder(
    orderId: string,
    reason: string,
  ): Promise<{
    order_id: string
    status: string
    cancellation_reason: string
    cancelled_at: string
    return_deadline_at: string
  }> {
    const response = await orderClient.post(`/orders/${orderId}/cancel`, { reason })
    return response.data
  },

  async markOrderReturned(
    orderId: string,
    reason: string,
  ): Promise<{ order_id: string; status: string; return_reason: string; returned_at: string }> {
    const response = await orderClient.post(`/orders/${orderId}/return`, { reason })
    return response.data
  },

  async collectPayment(orderId: string): Promise<{ order_id: string; payment_id: string; status: string }> {
    const response = await orderClient.post(`/orders/${orderId}/collect-payment`)
    return response.data
  },

  async collectCodBatch(orderIds: string[], shopId: string): Promise<{ batch_id: string; order_ids: string[]; status: string }> {
    const response = await orderClient.post('/orders/collect-cod-batch', { order_ids: orderIds, shop_id: shopId })
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

