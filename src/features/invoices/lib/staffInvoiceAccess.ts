import { CAPABILITIES } from '@/app/rbac/capabilities'
import { getCapabilitiesForRoles } from '@/app/rbac/policies'
import { extractRolesFromUser } from '@/app/rbac/normalizers'
import type { User } from '@/features/auth/types/authTypes'

/**
 * Shop owners/sellers use the seller dashboard capability. Staff authenticate
 * as customers, so their active shop memberships are the additional signal.
 * The invoice API independently verifies these memberships before returning
 * any shop data or document.
 */
export const hasStaffInvoiceAccess = (user: User | null): boolean => {
  if (!user) return false

  const capabilities = getCapabilitiesForRoles(extractRolesFromUser(user))
  const hasSellerCapability = capabilities.includes(CAPABILITIES.SELLER_DASHBOARD_VIEW)
  const hasStaffMembership = (user.staff_shop_ids ?? []).some((shopId) => shopId.trim().length > 0)
  return hasSellerCapability || hasStaffMembership
}
