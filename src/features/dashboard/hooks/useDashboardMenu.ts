import { useMemo } from 'react'
import { useAppSelector } from '@/app/hooks'
import { selectRoleCapabilities } from '@/app/rbac/selectors'
import { selectUnreadNotificationCount } from '@/features/notifications/selectors'
import { DASHBOARD_MENU_SELLER, DASHBOARD_MENU_ADMIN } from '../config/dashboardMenu'
import type { DashboardArea, DashboardMenuSection } from '../types/dashboardTypes'

const hasAnyRequiredCapability = (
  userCapabilities: readonly string[],
  requiredCapabilities: readonly string[],
): boolean => {
  if (userCapabilities.includes('*')) return true
  return requiredCapabilities.some((capability) => userCapabilities.includes(capability))
}

export const useDashboardMenu = (area: DashboardArea): DashboardMenuSection[] => {
  const roleCapabilities = useAppSelector(selectRoleCapabilities)
  const unreadCount = useAppSelector(selectUnreadNotificationCount)
  const sections = area === 'seller' ? DASHBOARD_MENU_SELLER : DASHBOARD_MENU_ADMIN

  return useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          items: section.items
            .filter((item) =>
              hasAnyRequiredCapability(roleCapabilities, item.requiredCapabilities),
            )
            .map((item) => {
              const isNotificationItem = item.key.endsWith('notifications') || item.to.includes('/notifications')
              return isNotificationItem
                ? { ...item, badge: unreadCount > 0 ? unreadCount : undefined }
                : item
            }),
        }))
        .filter((section) => section.items.length > 0),
    [area, roleCapabilities, sections, unreadCount],
  )
}