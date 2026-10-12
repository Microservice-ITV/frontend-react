import { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { selectRoleCapabilities } from '@/app/rbac/selectors'
import { purchaseApi } from '@/features/purchase/api/purchaseApi'
import { ORDERED_RECEIPT_COUNT_EVENT } from '@/features/purchase/orderedReceiptCount'
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
  const [orderedCount, setOrderedCount] = useState(0)

  useEffect(() => {
    if (area !== 'super_admin') return
    let cancelled = false

    const load = () => {
      void purchaseApi
        .listPurchaseOrders({ status: 'ORDERED' })
        .then((response) => {
          if (!cancelled) setOrderedCount(response.data?.data?.length ?? 0)
        })
        .catch(() => {
          if (!cancelled) setOrderedCount(0)
        })
    }

    load()
    window.addEventListener(ORDERED_RECEIPT_COUNT_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(ORDERED_RECEIPT_COUNT_EVENT, load)
    }
  }, [area])

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
              if (isNotificationItem) {
                return { ...item, badge: unreadCount > 0 ? unreadCount : undefined }
              }
              if (item.key.endsWith('warehouse-receipts')) {
                return { ...item, badge: orderedCount > 0 ? orderedCount : undefined }
              }
              return item
            }),
        }))
        .filter((section) => section.items.length > 0),
    [area, orderedCount, roleCapabilities, sections, unreadCount],
  )
}