import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  canSellerShip,
  fetchOrdersAcrossOwnedShops,
  isDeliveredPendingCodPayment,
  sellerOrderApi,
  sellerPaymentAmountDue,
  sellerOrderStatus,
  type SellerOrder,
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
})

describe('fetchOrdersAcrossOwnedShops', () => {
  it('uses one ecommerce-read request for all shops owned by the seller', async () => {
    const orders = [makeOrder()]
    vi.spyOn(sellerOrderApi, 'listShopsByUser').mockResolvedValue([
      { id: 'shop-1' },
      { id: 'shop-2' },
      { id: 'shop-3' },
    ])
    const shopOrders = vi.spyOn(sellerOrderApi, 'shopOrders').mockResolvedValue(orders)

    await expect(fetchOrdersAcrossOwnedShops('seller-1')).resolves.toEqual(orders)

    expect(shopOrders).toHaveBeenCalledTimes(1)
    expect(shopOrders).toHaveBeenCalledWith('shop-1', 'seller-1', ['shop-1', 'shop-2', 'shop-3'])
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
