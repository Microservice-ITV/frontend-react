import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  canSellerShip,
  fetchSellerOrderByIdAcrossOwnedShops,
  fetchSellerOrderSummariesAcrossOwnedShops,
  isDeliveredPendingCodPayment,
  sellerOrderApi,
  sellerPaymentAmountDue,
  sellerOrderStatus,
  type SellerOrder,
  type SellerOrderSummary,
  type PaymentRecord,
} from './sellerOrderApi'

const makeOrder = (overrides: Partial<SellerOrder> = {}): SellerOrder => ({
  orderId: 'order-1',
  customerId: 'customer-1',
  status: 'CONFIRMED',
  items: [],
  totals: {
    subtotal: 0,
    discount: 0,
    bundleDiscount: 0,
    shipping: 0,
    total: 0,
    currency: 'MMK',
  },
  payment: {
    status: 'PAID',
    transactionId: '',
    failedReason: '',
  },
  ...overrides,
})
const makeOrderSummary = (overrides: Partial<SellerOrderSummary> = {}): SellerOrderSummary => ({
  orderId: 'order-1',
  customerId: 'customer-1',
  status: 'CONFIRMED',
  items: [{ productId: 'product-1', name: 'Product', shopId: 'shop-1' }],
  totals: { total: 100, currency: 'MMK' },
  ...overrides,
})

afterEach(() => vi.restoreAllMocks())

describe('seller order fulfillment status', () => {
  it('uses the seller shop status when the overall order status is not ready to ship', () => {
    const order = makeOrder({
      shopBreakdown: [{
        shopOrderId: 'shop-order-1',
        shopId: 'shop-1',
        subtotal: 0,
        discount: 0,
        shipping: 0,
        total: 0,
        currency: 'MMK',
        status: 'READY_FOR_FULFILLMENT',
      }],
    })

    expect(sellerOrderStatus(order)).toBe('READY_FOR_FULFILLMENT')
    expect(canSellerShip(order)).toBe(true)
  })

  it('keeps partially shipped orders visible as actionable for remaining seller shops', () => {
    const order = makeOrder({
      shopBreakdown: [
        {
          shopOrderId: 'shop-order-1',
          shopId: 'shop-1',
          subtotal: 0,
          discount: 0,
          shipping: 0,
          total: 0,
          currency: 'MMK',
          status: 'SHIPPED',
        },
        {
          shopOrderId: 'shop-order-2',
          shopId: 'shop-2',
          subtotal: 0,
          discount: 0,
          shipping: 0,
          total: 0,
          currency: 'MMK',
          status: 'READY_FOR_FULFILLMENT',
        },
      ],
    })

    expect(sellerOrderStatus(order)).toBe('PARTIALLY_FULFILLED')
    expect(canSellerShip(order)).toBe(true)
  })

  it('keeps delivered seller orders labeled DELIVERED instead of SHIPPED', () => {
    const order = makeOrder({
      status: 'DELIVERED',
      shopBreakdown: [{
        shopOrderId: 'shop-order-1',
        shopId: 'shop-1',
        subtotal: 100,
        discount: 0,
        shipping: 0,
        total: 100,
        currency: 'MMK',
        status: 'SHIPPED',
      }],
    })

    expect(sellerOrderStatus(order)).toBe('DELIVERED')
  })
})

describe('fetchSellerOrderSummariesAcrossOwnedShops', () => {
  it('requests the compact list projection for the authenticated active shop', async () => {
    const summaries = [makeOrderSummary()]
    const shopOrderSummaries = vi.spyOn(sellerOrderApi, 'shopOrderSummaries').mockResolvedValue(summaries)

    await expect(fetchSellerOrderSummariesAcrossOwnedShops('seller-1', 'shop-2')).resolves.toEqual(summaries)

    expect(shopOrderSummaries).toHaveBeenCalledTimes(1)
    expect(shopOrderSummaries).toHaveBeenCalledWith('shop-2', 'seller-1', undefined)
  })

  it('filters by seller status locally and sorts newest orders first', async () => {
    const shopOrderSummaries = vi.spyOn(sellerOrderApi, 'shopOrderSummaries').mockResolvedValue([
      makeOrderSummary({ orderId: 'order-older', placedAt: '2026-01-01T00:00:00.000Z', status: 'CONFIRMED' }),
      makeOrderSummary({ orderId: 'order-newer', placedAt: '2026-06-01T00:00:00.000Z', status: 'CANCELLED' }),
    ])

    const orders = await fetchSellerOrderSummariesAcrossOwnedShops('seller-1', 'shop-1', 'cancelled')

    expect(shopOrderSummaries).toHaveBeenCalledWith('shop-1', 'seller-1', undefined)
    expect(orders.map((order) => order.orderId)).toEqual(['order-newer'])
  })
})

describe('fetchSellerOrderByIdAcrossOwnedShops', () => {
  it('requests a single full order by id instead of the seller order history', async () => {
    const order = makeOrder()
    const shopOrders = vi.spyOn(sellerOrderApi, 'shopOrders').mockResolvedValue([order])

    await expect(fetchSellerOrderByIdAcrossOwnedShops('order-1', 'seller-1', 'shop-2')).resolves.toEqual(order)

    expect(shopOrders).toHaveBeenCalledTimes(1)
    expect(shopOrders).toHaveBeenCalledWith('shop-2', 'seller-1')
  })

  it('resolves null when the order is outside the seller scope', async () => {
    const shopOrders = vi.spyOn(sellerOrderApi, 'shopOrders').mockResolvedValue([])

    await expect(
      fetchSellerOrderByIdAcrossOwnedShops('order-missing', 'seller-1', 'shop-1'),
    ).resolves.toBeNull()
    expect(shopOrders).toHaveBeenCalledWith('shop-1', 'seller-1')
  })

  it('does not request orders when no active shop is selected', async () => {
    const shopOrders = vi.spyOn(sellerOrderApi, 'shopOrders')
    await expect(fetchSellerOrderByIdAcrossOwnedShops('order-1', 'seller-1')).resolves.toBeNull()
    expect(shopOrders).not.toHaveBeenCalled()
  })
})

describe('seller COD due payments', () => {
  const makePayment = (overrides: Partial<PaymentRecord> = {}): PaymentRecord => ({
    id: 'payment-1',
    orderId: 'order-1',
    amount: 100,
    currency: 'MMK',
    status: 'PENDING',
    provider: 'cod',
    createdAt: '2026-10-16T10:00:00.000Z',
    updatedAt: '2026-10-16T10:00:00.000Z',
    sellerDeliveryStatus: 'DELIVERED',
    seller: {
      orderShare: 100,
      payout: 97,
      platformFee: 3,
      discountShare: 0,
      shippingShare: 0,
      shopCount: 1,
    },
    ...overrides,
  })

  it('includes only delivered, pending COD provider records', () => {
    expect(isDeliveredPendingCodPayment(makePayment())).toBe(true)
    expect(isDeliveredPendingCodPayment(makePayment({ status: 'SUCCESS' }))).toBe(false)
    expect(isDeliveredPendingCodPayment(makePayment({ deliveryStatus: 'IN_TRANSIT', sellerDeliveryStatus: null }))).toBe(false)
    expect(isDeliveredPendingCodPayment(makePayment({ provider: 'stripe', paymentMethod: 'cod' }))).toBe(false)
  })

  it('uses the seller payout for the due amount and falls back for legacy allocations', () => {
    expect(sellerPaymentAmountDue(makePayment())).toBe(97)
    expect(sellerPaymentAmountDue(makePayment({ seller: null }))).toBe(100)
  })
})

describe('seller active shop scope', () => {
  it('keeps listShopsByUser callers on the authenticated active membership API', async () => {
    const { authClient } = await import('@/lib/api/authClient')
    const get = vi.spyOn(authClient, 'get').mockResolvedValue({
      data: { data: { access_context: { shops: [
        { shop_id: 'assigned-shop', shop_name: 'Assigned Shop', shop_domain: 'assigned.example', membership_status: 'active', role: { code: 'shop_admin' } },
        { shop_id: 'inactive-shop', membership_status: 'inactive', role: { code: 'shop_admin' } },
        { shop_id: 'viewer-shop', membership_status: 'active', role: { code: 'shop_viewer' } },
      ] } } },
    } as never)

    await expect(sellerOrderApi.listShopsByUser('current-user')).resolves.toEqual([
      { id: 'assigned-shop', shopId: 'assigned-shop', name: 'Assigned Shop', slug: 'assigned.example' },
    ])
    expect(get).toHaveBeenCalledWith('/me/access-context')
  })

  it('uses the active shop and does not send a request without one', async () => {
    const summaries = vi.spyOn(sellerOrderApi, 'shopOrderSummaries').mockResolvedValue([])
    await fetchSellerOrderSummariesAcrossOwnedShops('seller-1', 'active-shop')
    expect(summaries).toHaveBeenCalledWith('active-shop', 'seller-1', undefined)
    summaries.mockClear()
    await expect(fetchSellerOrderSummariesAcrossOwnedShops('seller-1')).resolves.toEqual([])
    expect(summaries).not.toHaveBeenCalled()
  })
})

describe('seller order page transport', () => {
  it('requests the supported shopOrders projection and applies search and pagination locally', async () => {
    const { ecommerceReadClient } = await import('@/lib/api/ecommerceReadClient')
    const { fetchSellerOrderPage } = await import('./sellerOrderApi')
    const orders = Array.from({ length: 12 }, (_, index) => makeOrderSummary({
      orderId: `order-${index + 1}`,
      items: [{ productId: `product-${index + 1}`, name: index === 11 ? 'Blue shoe' : 'Product', shopId: 'shop-1' }],
    }))
    const post = vi.spyOn(ecommerceReadClient, 'post').mockResolvedValue({ data: { data: { shopOrders: orders } } })
    const signal = new AbortController().signal
    const params = { userId: 'seller-1', activeShopId: 'shop-1', page: 1, limit: 10, search: 'shoe', statusFilter: 'all' as const }
    await expect(fetchSellerOrderPage(params, signal)).resolves.toEqual({
      items: [orders[11]], total: 1, page: 1, limit: 10,
    })
    expect(post).toHaveBeenCalledWith('', {
      query: expect.stringContaining('shopOrders(shopId: $shopId, userId: $userId)'),
      variables: { shopId: 'shop-1', userId: 'seller-1' },
    }, { signal })
    const body = post.mock.calls[0][1] as { query: string }
    expect(body.query).toContain('recipientName')
    expect(body.query).not.toContain('sellerOrderPage')
  })

  it('rejects GraphQL errors and avoids requests without an active shop', async () => {
    const { ecommerceReadClient } = await import('@/lib/api/ecommerceReadClient')
    const { fetchSellerOrderPage } = await import('./sellerOrderApi')
    const post = vi.spyOn(ecommerceReadClient, 'post')
    const params = { userId: 'seller-1', activeShopId: 'shop-1', page: 1, limit: 10, search: '', statusFilter: 'all' as const }
    post.mockResolvedValueOnce({ data: { errors: [{ message: 'Shop access unavailable' }] } })
    await expect(fetchSellerOrderPage(params)).rejects.toThrow('Shop access unavailable')
    post.mockClear()
    await expect(fetchSellerOrderPage({ ...params, activeShopId: null })).resolves.toEqual({
      items: [], total: 0, page: 1, limit: 10,
    })
    expect(post).not.toHaveBeenCalled()
  })
})
