import { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { selectRoleCapabilities } from '@/app/rbac/selectors'
import { purchaseApi } from '@/features/purchase/api/purchaseApi'
import { ORDERED_RECEIPT_COUNT_EVENT } from '@/features/purchase/orderedReceiptCount'
import { selectUnreadNotificationCount } from '@/features/notifications/selectors'
import { DASHBOARD_MENU_SELLER, DASHBOARD_MENU_ADMIN, DASHBOARD_MENU_WAREHOUSE_MANAGER } from '../config/dashboardMenu'
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
  const sections =
    area === 'seller'
      ? DASHBOARD_MENU_SELLER
      : area === 'warehouse_manager'
        ? DASHBOARD_MENU_WAREHOUSE_MANAGER
        : DASHBOARD_MENU_ADMIN
  const [orderedCount, setOrderedCount] = useState(0)
  const [supplierReceiveCount, setSupplierReceiveCount] = useState(0)

  useEffect(() => {
    if (area !== 'warehouse_manager') return
    let cancelled = false

    const load = () => {
      void purchaseApi
        .listPurchaseOrders({ status: 'ORDERED' })
        .then((response) => {
          if (cancelled) return
          const waiting = response.data?.data ?? []
          setOrderedCount(waiting.filter((order) => order.orderKind !== 'SUPPLIER').length)
          setSupplierReceiveCount(waiting.filter((order) => order.orderKind === 'SUPPLIER').length)
        })
        .catch(() => {
          if (!cancelled) {
            setOrderedCount(0)
            setSupplierReceiveCount(0)
          }
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
              if (item.key.endsWith('warehouse-supplier-receive')) {
                return { ...item, badge: supplierReceiveCount > 0 ? supplierReceiveCount : undefined }
              }
              return item
            }),
        }))
        .filter((section) => section.items.length > 0),
    [area, orderedCount, roleCapabilities, sections, supplierReceiveCount, unreadCount],
  )
}