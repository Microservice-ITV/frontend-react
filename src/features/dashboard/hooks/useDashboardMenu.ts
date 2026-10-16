import { useEffect, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectRoleCapabilities } from '@/app/rbac/selectors'
import { purchaseApi } from '@/features/purchase/api/purchaseApi'
import { ORDERED_RECEIPT_COUNT_EVENT } from '@/features/purchase/orderedReceiptCount'
import { warehouseApi } from '@/features/warehouse/api/warehouseApi'
import { selectUnreadNotificationCount } from '@/features/notifications/selectors'
import {
  fetchSellerProductsByShop,
  selectSellerStockAlertCount,
} from '@/features/seller/store'
import { DASHBOARD_MENU_BADGE_EVENT } from '../dashboardMenuBadges'
import {
  DASHBOARD_MENU_SELLER,
  DASHBOARD_MENU_ADMIN,
  DASHBOARD_MENU_WAREHOUSE_MANAGER,
  DASHBOARD_MENU_DELIVERY_AGENT,
} from '../config/dashboardMenu'
import type { DashboardArea, DashboardMenuSection } from '../types/dashboardTypes'

const hasAnyRequiredCapability = (
  userCapabilities: readonly string[],
  requiredCapabilities: readonly string[],
): boolean => {
  if (userCapabilities.includes('*')) return true
  return requiredCapabilities.some((capability) => userCapabilities.includes(capability))
}

export const useDashboardMenu = (area: DashboardArea): DashboardMenuSection[] => {
  const dispatch = useAppDispatch()
  const roleCapabilities = useAppSelector(selectRoleCapabilities)
  const unreadCount = useAppSelector(selectUnreadNotificationCount)
  const stockAlertCount = useAppSelector(selectSellerStockAlertCount)
  const activeShopId = useAppSelector((state) => state.auth.user?.active_shop_id ?? null)
  const sections =
    area === 'seller'
      ? DASHBOARD_MENU_SELLER
      : area === 'warehouse_manager'
        ? DASHBOARD_MENU_WAREHOUSE_MANAGER
        : area === 'delivery_agent'
          ? DASHBOARD_MENU_DELIVERY_AGENT
          : DASHBOARD_MENU_ADMIN

  const [receiptCount, setReceiptCount] = useState(0)
  const [trackingCount, setTrackingCount] = useState(0)
  const [parcelCount, setParcelCount] = useState(0)
  const [damageReportCount, setDamageReportCount] = useState(0)
  const [transferCount, setTransferCount] = useState(0)
  const [sellerRequestCount, setSellerRequestCount] = useState(0)
  const [warehouseOrderActionCount, setWarehouseOrderActionCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = () => {
      if (area === 'seller') {
        void purchaseApi
          .listPurchaseOrders({ limit: 200 })
          .then((response) => {
            if (cancelled) return
            const waiting = response.data?.data ?? []
            setTrackingCount(
              waiting.filter(
                (order) =>
                  order.orderKind === 'SUPPLIER' &&
                  (order.status === 'IN_TRANSIT' || order.status === 'ORDERED'),
              ).length,
            )
            setWarehouseOrderActionCount(
              waiting.filter(
                (order) =>
                  order.orderKind === 'WAREHOUSE' &&
                  (order.status === 'AWAITING_SELLER_RECEIPT' ||
                    order.status === 'APPROVED' ||
                    order.status === 'ORDERED' ||
                    order.status === 'LOW_STOCK' ||
                    order.status === 'RESTOCK_REQUESTED' ||
                    order.status === 'RESTOCK_APPROVED'),
              ).length,
            )
            setReceiptCount(0)
          })
          .catch(() => {
            if (!cancelled) {
              setTrackingCount(0)
              setWarehouseOrderActionCount(0)
              setReceiptCount(0)
            }
          })

        void purchaseApi
          .listDamageReports()
          .then((response) => {
            if (cancelled) return
            const rows = response.data?.data ?? []
            setDamageReportCount(
              rows.filter((row: { status?: string }) => row.status === 'SUBMITTED').length,
            )
          })
          .catch(() => {
            if (!cancelled) setDamageReportCount(0)
          })

        void warehouseApi
          .listTransfers({ status: 'PENDING', limit: 100 })
          .then((response) => {
            if (cancelled) return
            const rows = response.data?.data ?? []
            setTransferCount(
              rows.filter(
                (row) => Boolean(row.approvalSellerUserId) && !row.fromSellerUserId,
              ).length,
            )
          })
          .catch(() => {
            if (!cancelled) setTransferCount(0)
          })

        if (activeShopId) {
          void dispatch(fetchSellerProductsByShop({ shopId: activeShopId }))
        }
        return
      }

      if (area === 'warehouse_manager') {
        void purchaseApi
          .listPurchaseOrders({ limit: 200 })
          .then((response) => {
            if (cancelled) return
            const waiting = response.data?.data ?? []
            setReceiptCount(
              waiting.filter(
                (order) =>
                  order.orderKind === 'SUPPLIER' &&
                  (order.status === 'AWAITING_WAREHOUSE_RECEIPT' ||
                    order.status === 'AWAITING_SELLER_RECEIPT'),
              ).length,
            )
            setSellerRequestCount(
              waiting.filter(
                (order) =>
                  order.orderKind === 'WAREHOUSE' &&
                  (order.status === 'PENDING_APPROVAL' ||
                    order.status === 'PENDING' ||
                    order.status === 'LOW_STOCK'),
              ).length,
            )
            setTrackingCount(0)
          })
          .catch(() => {
            if (!cancelled) {
              setReceiptCount(0)
              setSellerRequestCount(0)
              setTrackingCount(0)
            }
          })

        void Promise.all([
          warehouseApi.listWarehouses({ status: 'ACTIVE' }),
          warehouseApi.listTransfers({ limit: 200 }),
        ])
          .then(([warehousesResponse, transfersResponse]) => {
            if (cancelled) return
            const owned = new Set(
              (warehousesResponse.data?.data ?? []).map((warehouse) => warehouse.id),
            )
            const rows = transfersResponse.data?.data ?? []
            setTransferCount(
              rows.filter(
                (row) =>
                  (row.status === 'SELLER_APPROVED' && owned.has(row.fromWarehouseId ?? '')) ||
                  (row.status === 'AWAITING_RECEIPT' && owned.has(row.toWarehouseId)) ||
                  (row.status === 'PENDING' &&
                    Boolean(row.fromSellerUserId) &&
                    owned.has(row.toWarehouseId)),
              ).length,
            )
          })
          .catch(() => {
            if (!cancelled) setTransferCount(0)
          })
        return
      }

      if (area === 'delivery_agent') {
        void purchaseApi
          .listPurchaseOrders()
          .then((response) => {
            if (cancelled) return
            const waiting = response.data?.data ?? []
            setParcelCount(
              waiting.filter(
                (order) =>
                  order.orderKind === 'SUPPLIER' &&
                  (order.status === 'ARRIVED' || order.status === 'DELIVERY_PICKED_UP'),
              ).length,
            )
          })
          .catch(() => {
            if (!cancelled) setParcelCount(0)
          })
      }
    }

    load()
    window.addEventListener(ORDERED_RECEIPT_COUNT_EVENT, load)
    window.addEventListener(DASHBOARD_MENU_BADGE_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(ORDERED_RECEIPT_COUNT_EVENT, load)
      window.removeEventListener(DASHBOARD_MENU_BADGE_EVENT, load)
    }
  }, [activeShopId, area, dispatch])

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
              const isNotificationItem =
                item.key.endsWith('notifications') || item.to.includes('/notifications')
              if (isNotificationItem) {
                return { ...item, badge: unreadCount > 0 ? unreadCount : undefined }
              }
              if (item.key.endsWith('warehouse-receipts')) {
                return { ...item, badge: receiptCount > 0 ? receiptCount : undefined }
              }
              if (item.key.endsWith('warehouse-purchase-tracking')) {
                return { ...item, badge: trackingCount > 0 ? trackingCount : undefined }
              }
              if (item.key === 'delivery-parcels') {
                return { ...item, badge: parcelCount > 0 ? parcelCount : undefined }
              }
              if (item.key === 'seller-damage-reports') {
                return { ...item, badge: damageReportCount > 0 ? damageReportCount : undefined }
              }
              if (item.key.endsWith('warehouse-transfer')) {
                return { ...item, badge: transferCount > 0 ? transferCount : undefined }
              }
              if (item.key.endsWith('warehouse-seller-requests')) {
                return {
                  ...item,
                  badge: sellerRequestCount > 0 ? sellerRequestCount : undefined,
                }
              }
              if (item.key.endsWith('warehouse-from-warehouse')) {
                return {
                  ...item,
                  badge:
                    warehouseOrderActionCount > 0 ? warehouseOrderActionCount : undefined,
                }
              }
              if (item.key === 'seller-products') {
                return {
                  ...item,
                  badge: stockAlertCount > 0 ? stockAlertCount : undefined,
                  badgeTone: stockAlertCount > 0 ? 'alert' : undefined,
                }
              }
              return item
            }),
        }))
        .filter((section) => section.items.length > 0),
    [
      damageReportCount,
      parcelCount,
      receiptCount,
      roleCapabilities,
      sections,
      sellerRequestCount,
      trackingCount,
      transferCount,
      stockAlertCount,
      unreadCount,
      warehouseOrderActionCount,
    ],
  )
}
