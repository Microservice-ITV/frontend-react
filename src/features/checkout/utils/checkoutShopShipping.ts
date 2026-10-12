import type { CartItem } from '@/features/cart/types/cartTypes'
import type { CheckoutStatusResponse } from '../types/checkoutTypes'

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

export function checkoutShopsHaveDeliveryCompanies(
  shopMappings: CheckoutShopMapping[],
  deliveryCompanyIdByCartShopId: Record<string, string>,
): boolean {
  return shopMappings.length > 0 && shopMappings.every(({ cartShopId }) =>
    Boolean(cartShopId && deliveryCompanyIdByCartShopId[cartShopId]?.trim()),
  )
}
