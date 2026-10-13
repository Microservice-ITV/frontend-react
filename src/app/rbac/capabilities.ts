export const CAPABILITIES = {
  ACCOUNT_VIEW: 'account.view',
  ACCOUNT_PROFILE_VIEW: 'account.profile.view',
  ACCOUNT_ADDRESSES_MANAGE: 'account.addresses.manage',
  ACCOUNT_ORDERS_VIEW: 'account.orders.view',
  ACCOUNT_SECURITY_MANAGE: 'account.security.manage',
  CHECKOUT_VIEW: 'checkout.view',
  CHECKOUT_PLACE_ORDER: 'checkout.place_order',
  SELLER_DASHBOARD_VIEW: 'seller.dashboard.view',
  PLATFORM_ADMIN_VIEW: 'platform.admin.view',
  WAREHOUSE_DASHBOARD_VIEW: 'warehouse.dashboard.view',
  SELLER_PERMISSIONS_VIEW: 'seller.permissions.view',
  SELLER_PERMISSIONS_MANAGE: 'seller.permissions.manage',
  /** Browse platform categories (list + detail) — shop roles */
  CATEGORIES_VIEW: 'categories.view',
  /** Create / update / delete categories — super admin */
  CATEGORIES_MANAGE: 'categories.manage',
  PROMOTIONS_VIEW: 'promotions.view',
  /** Create, schedule, publish and remove flash deals — super admin and sellers */
  FLASH_DEALS_MANAGE: 'flash.deals.manage',
  ALL: '*',
} as const
