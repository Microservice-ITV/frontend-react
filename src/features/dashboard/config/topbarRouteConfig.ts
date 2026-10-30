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
  warehouse_manager: {
    newOrderPath: '/warehouse-manager/warehouse',
    settingsPath: '/warehouse-manager/warehouse',
    notificationsPath: '/warehouse-manager/warehouse',
  },
  delivery_agent: {
    newOrderPath: '/delivery-agent/parcels',
    settingsPath: '/delivery-agent/overview',
    notificationsPath: '/delivery-agent/overview',
  },
  payroll: {
    newOrderPath: '#',
    settingsPath: '/payroll/runs',
    notificationsPath: '/payroll/runs',
  },
  employee: {
    newOrderPath: '/employee/my-leave',
    settingsPath: '/employee/my-leave',
    notificationsPath: '/employee/my-leave',
  },
}

export const getTopbarRouteConfig = (area: DashboardArea): TopbarRouteConfig =>
  TOPBAR_ROUTE_CONFIG[area]