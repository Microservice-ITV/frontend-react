/**
 * Prepaid "Cash" is only for shop staff buying exclusively from their own shop(s).
 * Hidden for normal customers and when the cart includes any other shop.
 */
export function canUseStaffCheckoutCash(params: {
  staffShopIds?: readonly string[] | null
  cartShopIds: readonly string[]
}): boolean {
  const staffShopIds = (params.staffShopIds ?? [])
    .map((id) => id.trim())
    .filter(Boolean)

  if (staffShopIds.length === 0) return false

  const cartShopIds = [...new Set(
    params.cartShopIds
      .map((id) => id.trim())
      .filter((id) => id && id !== 'unknown'),
  )]

  if (cartShopIds.length === 0) return false

  const staffShopIdSet = new Set(staffShopIds)
  return cartShopIds.every((shopId) => staffShopIdSet.has(shopId))
}
