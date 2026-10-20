import { describe, expect, it } from 'vitest'
import {
  checkoutShopsHaveDeliveryCompanies,
  distributeShippingFee,
  mapCheckoutShopIdsToCartShopIds,
} from './checkoutShopShipping'

describe('checkout shop delivery-company validation', () => {
  it('validates each checkout shop against its cart shop mapping', () => {
    const mappings = mapCheckoutShopIdsToCartShopIds(
      ['cart-shop-1', 'cart-shop-2'],
      [
        { productId: 'product-1', shopId: 'cart-shop-1' },
        { productId: 'product-2', shopId: 'cart-shop-2' },
      ],
      [
        { shop_id: 'checkout-shop-1', product_id: 'product-1', qty: 1 },
        { shop_id: 'checkout-shop-2', product_id: 'product-2', qty: 1 },
      ],
    )

    expect(mappings).toEqual([
      { checkoutShopId: 'checkout-shop-1', cartShopId: 'cart-shop-1' },
      { checkoutShopId: 'checkout-shop-2', cartShopId: 'cart-shop-2' },
    ])
    expect(checkoutShopsHaveDeliveryCompanies(mappings, {
      'cart-shop-1': 'company-1',
      'cart-shop-2': 'company-2',
    })).toBe(true)
    expect(checkoutShopsHaveDeliveryCompanies(mappings, {
      'cart-shop-1': 'company-1',
    })).toBe(false)
  })

  it('rejects a checkout shop whose products cannot be mapped to a cart shop', () => {
    const mappings = mapCheckoutShopIdsToCartShopIds(
      ['cart-shop-1'],
      [{ productId: 'product-1', shopId: 'cart-shop-1' }],
      [{ shop_id: 'checkout-shop-1', product_id: 'unknown-product', qty: 1 }],
    )

    expect(checkoutShopsHaveDeliveryCompanies(mappings, {
      'cart-shop-1': 'company-1',
    })).toBe(false)
  })

  it('does not allow an empty shop list or blank company IDs', () => {
    expect(checkoutShopsHaveDeliveryCompanies([], {})).toBe(false)
    expect(checkoutShopsHaveDeliveryCompanies([
      { checkoutShopId: 'shop-1', cartShopId: 'shop-1' },
    ], { 'shop-1': '  ' })).toBe(false)
  })

  it('allows shops that have no selectable delivery company', () => {
    expect(checkoutShopsHaveDeliveryCompanies([
      { checkoutShopId: 'shop-1', cartShopId: 'shop-1' },
      { checkoutShopId: 'shop-2', cartShopId: 'shop-2' },
    ], {
      'shop-2': 'company-2',
    }, new Set(['shop-1']))).toBe(true)

    expect(checkoutShopsHaveDeliveryCompanies([
      { checkoutShopId: 'shop-1', cartShopId: 'shop-1' },
    ], {}, new Set(['shop-1']))).toBe(true)
  })
})

describe('distributeShippingFee', () => {
  it('puts the whole fee on a single shop', () => {
    expect(distributeShippingFee([{ shipping_fee: 0 }], 1500)).toEqual([{ shipping_fee: 1500 }])
  })

  it('splits an uneven fee without losing cents', () => {
    expect(distributeShippingFee(
      [{ shipping_fee: 0 }, { shipping_fee: 0 }, { shipping_fee: 0 }],
      10,
    )).toEqual([
      { shipping_fee: 3.34 },
      { shipping_fee: 3.33 },
      { shipping_fee: 3.33 },
    ])
  })
})
