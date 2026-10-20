import type { User } from '@/features/auth/types/authTypes'
import type { UserAddress } from '@/features/account/types/addressTypes'

export const STAFF_CHECKOUT_ADDRESS_KEY = 'dni.staff_checkout.delivery_address'

const STAFF_ROLE = /^(STAFF|SHOP_STAFF)$/

function roleTokens(user: User): string[] {
  const tokens: string[] = []
  if (user.role) tokens.push(user.role)
  if (user.role_name) tokens.push(user.role_name)
  for (const roleEntry of user.roles ?? []) {
    if (typeof roleEntry === 'string') {
      tokens.push(roleEntry)
      continue
    }
    if (roleEntry.code) tokens.push(roleEntry.code)
    if (roleEntry.name) tokens.push(roleEntry.name)
  }
  return tokens
}

/** Shop staff place checkout for a customer, not from their own saved addresses. */
export function isShopStaffUser(user: User | null | undefined): boolean {
  if (!user) return false
  const shopIds = (user.staff_shop_ids ?? []).map((id) => id.trim()).filter(Boolean)
  if (shopIds.length > 0) return true
  return roleTokens(user).some((token) =>
    STAFF_ROLE.test(token.trim().toUpperCase().replace(/[\s-]+/g, '_')),
  )
}

export function readStaffCheckoutAddress(): UserAddress | null {
  try {
    const raw = sessionStorage.getItem(STAFF_CHECKOUT_ADDRESS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as UserAddress
    if (!parsed?.full_name || !parsed.phone_no || !parsed.address_line_1 || parsed.district_id == null) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeStaffCheckoutAddress(address: UserAddress): void {
  sessionStorage.setItem(STAFF_CHECKOUT_ADDRESS_KEY, JSON.stringify(address))
}
