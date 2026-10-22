import type { CartItem } from '@/features/cart/types/cartTypes'
import type { CheckoutStatusResponse } from '../types/checkoutTypes'
import { parseCashAmount } from './cashTender'

export type CheckoutShopMapping = {
  checkoutShopId: string
  cartShopId: string | undefined
}

export function mapCheckoutShopIdsToCartShopIds(
  fallbackShopIds: string[],
  cartItems: Pick<CartItem, 'productId' | 'shopId'>[],
  checkoutSessionItems: CheckoutStatusResponse['items'] | undefined,
): CheckoutShopMapping[] {
  const cartProductToShop = new Map(cartItems.map((item) => [item.productId, item.shopId]))
  const sessionShops = new Map<string, string[]>()

  for (const item of checkoutSessionItems ?? []) {
    const shopId = item.shop_id?.trim()
    if (!shopId) continue
    const productIds = sessionShops.get(shopId) ?? []
    productIds.push(item.product_id)
    sessionShops.set(shopId, productIds)
  }

  const checkoutShopIds = sessionShops.size > 0 ? [...sessionShops.keys()] : fallbackShopIds

  return checkoutShopIds.map((checkoutShopId) => {
    const productIds = sessionShops.get(checkoutShopId)
    if (!productIds) return { checkoutShopId, cartShopId: checkoutShopId }

    const cartShopId = productIds
      .map((productId) => cartProductToShop.get(productId))
      .find((shopId): shopId is string => Boolean(shopId))

    return { checkoutShopId, cartShopId }
  })
}

export function parseDeliveryFeeInput(value: string): number {
  return parseCashAmount(value)
}

/** Split a manual delivery fee across shop rows so the fees still sum to the total. */
export function distributeShippingFee<T extends { shipping_fee: number }>(
  rows: T[],
  total: number,
): T[] {
  if (rows.length === 0) return rows
  const safeTotal = Number.isFinite(total) && total > 0 ? Math.round(total * 100) : 0
  const base = Math.floor(safeTotal / rows.length)
  let remainder = safeTotal - base * rows.length
  return rows.map((row) => {
    const extra = remainder > 0 ? 1 : 0
    if (remainder > 0) remainder -= 1
    return { ...row, shipping_fee: (base + extra) / 100 }
  })
}

export function checkoutShopsHaveDeliveryCompanies(
  shopMappings: CheckoutShopMapping[],
  deliveryCompanyIdByCartShopId: Record<string, string>,
  cartShopIdsWithoutSelectableCompany: ReadonlySet<string> = new Set(),
): boolean {
  return shopMappings.length > 0 && shopMappings.every(({ cartShopId }) => {
    if (!cartShopId) return false
    if (cartShopIdsWithoutSelectableCompany.has(cartShopId)) return true
    return Boolean(deliveryCompanyIdByCartShopId[cartShopId]?.trim())
  })
}
