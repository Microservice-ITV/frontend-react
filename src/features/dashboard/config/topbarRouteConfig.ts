import type { DashboardArea } from '../types/dashboardTypes'

type TopbarRouteConfig = {
  newOrderPath: string
  settingsPath: string
  notificationsPath: string
}

const TOPBAR_ROUTE_CONFIG: Record<DashboardArea, TopbarRouteConfig> = {
  seller: {
    newOrderPath: '/seller/orders',
    settingsPath: '/seller/settings',
    notificationsPath: '/seller/notifications',
  },
  super_admin: {
    // Keep existing behavior for CTA; super-admin has no "new order" flow.
    newOrderPath: '#',
    settingsPath: '/super-admin/settings',
    notificationsPath: '/super-admin/notifications',
  },
}

export const getTopbarRouteConfig = (area: DashboardArea): TopbarRouteConfig =>
  TOPBAR_ROUTE_CONFIG[area]