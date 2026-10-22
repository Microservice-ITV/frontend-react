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
  it('requests the compact list projection once for all shops owned by the seller', async () => {
    const summaries = [makeOrderSummary()]
    vi.spyOn(sellerOrderApi, 'listShopsByUser').mockResolvedValue([
      { id: 'shop-1' },
      { id: 'shop-2' },
      { id: 'shop-3' },
    ])
    const shopOrderSummaries = vi.spyOn(sellerOrderApi, 'shopOrderSummaries').mockResolvedValue(summaries)

    await expect(fetchSellerOrderSummariesAcrossOwnedShops('seller-1')).resolves.toEqual(summaries)

    expect(shopOrderSummaries).toHaveBeenCalledTimes(1)
    expect(shopOrderSummaries).toHaveBeenCalledWith('shop-1', 'seller-1', ['shop-1', 'shop-2', 'shop-3'], 'all')
  })

  it('passes the selected seller status filter and sorts the newest orders first', async () => {
    vi.spyOn(sellerOrderApi, 'listShopsByUser').mockResolvedValue([{ id: 'shop-1' }])
    const shopOrderSummaries = vi.spyOn(sellerOrderApi, 'shopOrderSummaries').mockResolvedValue([
      makeOrderSummary({ orderId: 'order-older', placedAt: '2026-01-01T00:00:00.000Z' }),
      makeOrderSummary({ orderId: 'order-newer', placedAt: '2026-06-01T00:00:00.000Z' }),
    ])

    const orders = await fetchSellerOrderSummariesAcrossOwnedShops('seller-1', undefined, 'to-ship')

    expect(shopOrderSummaries).toHaveBeenCalledWith('shop-1', 'seller-1', ['shop-1'], 'to-ship')
    expect(orders.map((order) => order.orderId)).toEqual(['order-newer', 'order-older'])
  })
})

describe('fetchSellerOrderByIdAcrossOwnedShops', () => {
  it('requests a single full order by id instead of the seller order history', async () => {
    const order = makeOrder()
    vi.spyOn(sellerOrderApi, 'listShopsByUser').mockResolvedValue([
      { id: 'shop-1' },
      { id: 'shop-2' },
    ])
    const shopOrders = vi.spyOn(sellerOrderApi, 'shopOrders').mockResolvedValue([order])

    await expect(fetchSellerOrderByIdAcrossOwnedShops('order-1', 'seller-1')).resolves.toEqual(order)

    expect(shopOrders).toHaveBeenCalledTimes(1)
    expect(shopOrders).toHaveBeenCalledWith('shop-1', 'seller-1', ['shop-1', 'shop-2'], 'all', 'order-1')
  })

  it('resolves null when the order is outside the seller scope', async () => {
    vi.spyOn(sellerOrderApi, 'listShopsByUser').mockResolvedValue([{ id: 'shop-1' }])
    vi.spyOn(sellerOrderApi, 'shopOrders').mockResolvedValue([])

    await expect(
      fetchSellerOrderByIdAcrossOwnedShops('order-missing', 'seller-1'),
    ).resolves.toBeNull()
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
  it('skips the frontend ownership lookup when the active shop is available', async () => {
    const lookup = vi.spyOn(sellerOrderApi, 'listShopsByUser')
    const summaries = vi.spyOn(sellerOrderApi, 'shopOrderSummaries').mockResolvedValue([])
    await fetchSellerOrderSummariesAcrossOwnedShops('seller-1', 'active-shop')
    expect(lookup).not.toHaveBeenCalled()
    expect(summaries).toHaveBeenCalledWith('active-shop', 'seller-1', ['active-shop'], 'all')
  })
})

describe('seller order page transport', () => {
  it('sends server pagination/search and forwards the cancellation signal', async () => {
    const { ecommerceReadClient } = await import('@/lib/api/ecommerceReadClient')
    const { fetchSellerOrderPage } = await import('./sellerOrderApi')
    const page = { items: [makeOrderSummary()], total: 25, page: 2, limit: 10 }
    const post = vi.spyOn(ecommerceReadClient, 'post').mockResolvedValue({ data: { data: { sellerOrderPage: page } } })
    const signal = new AbortController().signal
    const params = { userId: 'seller-1', page: 2, limit: 10, search: 'shoe', statusFilter: 'all' as const }
    await expect(fetchSellerOrderPage(params, signal)).resolves.toEqual(page)
    expect(post).toHaveBeenCalledWith('', {
      query: expect.stringContaining('sellerOrderPage'), variables: params,
    }, { signal })
    const body = post.mock.calls[0][1] as { query: string }
    expect(body.query).toContain('recipientName')
    expect(body.query).not.toContain('fulfillment')
  })

  it('rejects GraphQL errors and missing page data', async () => {
    const { ecommerceReadClient } = await import('@/lib/api/ecommerceReadClient')
    const { fetchSellerOrderPage } = await import('./sellerOrderApi')
    const post = vi.spyOn(ecommerceReadClient, 'post')
    const params = { page: 1, limit: 10, search: '', statusFilter: 'all' as const }
    post.mockResolvedValueOnce({ data: { errors: [{ message: 'Ownership unavailable' }] } })
    await expect(fetchSellerOrderPage(params)).rejects.toThrow('Ownership unavailable')
    post.mockResolvedValueOnce({ data: { data: {} } })
    await expect(fetchSellerOrderPage(params)).rejects.toThrow('Missing seller order page')
  })
})
