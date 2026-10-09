import { describe, expect, it } from 'vitest'
import { canSellerShip, sellerOrderStatus, type SellerOrder } from './sellerOrderApi'

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
