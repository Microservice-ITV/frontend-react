import { CAPABILITIES } from '@/app/rbac/capabilities'

export const ROUTE_ACCESS = {
  accountRoot: [CAPABILITIES.ACCOUNT_VIEW],
  accountAddresses: [CAPABILITIES.ACCOUNT_ADDRESSES_MANAGE],
  accountOrders: [CAPABILITIES.ACCOUNT_ORDERS_VIEW],
  checkout: [CAPABILITIES.CHECKOUT_VIEW],
  checkoutSuccess: [CAPABILITIES.CHECKOUT_VIEW],
  sellerDashboard: [CAPABILITIES.SELLER_DASHBOARD_VIEW],
  sellerPermissions: [CAPABILITIES.SELLER_PERMISSIONS_VIEW],
  superAdminDashboard: [CAPABILITIES.PLATFORM_ADMIN_VIEW],
} as const
