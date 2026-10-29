import type { AxiosError } from 'axios'
import { adminUsersApi } from '@/features/admin/api/adminUsersApi'
import { warehouseClient } from '@/lib/api/warehouseClient'
import type {
  InventoryMovement,
  InventoryStock,
  StockMutationPayload,
  TransferPayload,
  Warehouse,
  WarehouseManagerOption,
  WarehousePayload,
  WarehouseStatus,
  WarehouseTransfer,
} from '../types/warehouseTypes'
import type {
  PurchaseAdditionalCost,
  PurchaseAdditionalCostPayload,
  PurchaseCostAdjustment,
  PurchaseCostAdjustmentPayload,
  PurchaseDeliveryStage,
  PurchaseDeliveryStagePayload,
  PurchaseOrder,
  PurchaseOrderPayload,
  PurchaseOrderStatus,
  PurchaseReceipt,
  PurchaseReceiptPayload,
  PurchaseReceiptStatus,
  PurchaseReturn,
  PurchaseReturnPayload,
  PurchaseReturnStatus,
  Supplier,
  SupplierPayload,
  SupplierStatus,
} from '../../purchase/types/purchaseTypes'

type Envelope<T> = { success: boolean; data: T }

export const warehouseErrorMessage = (error: unknown): string => {
  const axiosError = error as AxiosError<{
    error?: { code?: string; message?: string }
    message?: string
  }>
  return (
    axiosError.response?.data?.error?.message ??
    axiosError.response?.data?.message ??
    axiosError.message ??
    'Something went wrong'
  )
}

/**
 * Single access point for the warehouse-service. Every warehouse *and*
 * purchasing endpoint is routed through this module — there is no separate
 * purchase service.
 */
export const warehouseApi = {
  async listWarehouseManagers(): Promise<{
    data: Envelope<{ users: WarehouseManagerOption[]; warnings: string[] }>
  }> {
    const [employeeResult, assignedResult] = await Promise.allSettled([
      warehouseClient.get<Envelope<{ users: WarehouseManagerOption[] }>>(
        '/warehouse-managers',
      ),
      adminUsersApi.listWarehouseManagers(),
    ])
    const warnings: string[] = []
    const usersById = new Map<string, WarehouseManagerOption>()

    if (employeeResult.status === 'fulfilled') {
      for (const user of employeeResult.value.data.data?.users ?? []) {
        usersById.set(user.id, user)
      }
    } else {
      warnings.push(`Employee directory: ${warehouseErrorMessage(employeeResult.reason)}`)
    }

    if (assignedResult.status === 'fulfilled') {
      for (const user of assignedResult.value.data.data?.users ?? []) {
        const employeeUser = usersById.get(user.id)
        usersById.set(user.id, {
          id: user.id,
          name: employeeUser?.name || user.name,
          email: employeeUser?.email || user.email,
        })
      }
    } else {
      warnings.push(
        `Admin-assigned managers: ${adminUsersApi.getApiErrorMessage(
          assignedResult.reason,
          'Could not load admin-assigned warehouse managers.',
        )}`,
      )
    }

    if (usersById.size === 0 && warnings.length > 0) {
      throw new Error(warnings.join(' '))
    }

    return {
      data: {
        success: true,
        data: {
          users: [...usersById.values()].sort((a, b) => a.name.localeCompare(b.name)),
          warnings,
        },
      },
    }
  },

  listWarehouses(params?: {
    status?: WarehouseStatus | ''
    shopId?: string
    catalog?: boolean
    includePurchased?: boolean
  }) {
    return warehouseClient.get<Envelope<Warehouse[]>>('/warehouses', {
      params: {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.shopId ? { shopId: params.shopId } : {}),
        ...(params?.catalog ? { catalog: 'true' } : {}),
        ...(params?.includePurchased ? { includePurchased: 'true' } : {}),
      },
    })
  },

  getWarehouse(id: string) {
    return warehouseClient.get<Envelope<Warehouse>>(`/warehouses/${id}`)
  },

  createWarehouse(payload: WarehousePayload) {
    return warehouseClient.post<Envelope<Warehouse>>('/warehouses', payload)
  },

  updateWarehouse(id: string, payload: Partial<WarehousePayload>) {
    return warehouseClient.patch<Envelope<Warehouse>>(
      `/warehouses/${id}`,
      payload,
    )
  },

  deleteWarehouse(id: string) {
    return warehouseClient.delete<{ success: boolean }>(`/warehouses/${id}`)
  },

  listSellerStock() {
    return warehouseClient.get<
      Envelope<
        Array<{
          id: string
          userId: string
          productId: string
          variantId: string
          onHandQty: number
          availableQty: number
          updatedAt: string
        }>
      >
    >('/inventory/seller')
  },

  listInventory(warehouseId: string) {
    return warehouseClient.get<Envelope<InventoryStock[]>>(
      `/warehouses/${warehouseId}/inventory`,
    )
  },

  increaseStock(payload: StockMutationPayload & { movementType?: string }) {
    return warehouseClient.post<Envelope<InventoryStock>>(
      '/inventory/increase',
      payload,
    )
  },

  transferStock(payload: TransferPayload) {
    return warehouseClient.post<Envelope<WarehouseTransfer>>(
      '/inventory/transfer',
      payload,
    )
  },

  listTransfers(params?: {
    warehouseId?: string
    status?: string
    limit?: number
  }) {
    return warehouseClient.get<Envelope<WarehouseTransfer[]>>(
      '/inventory/transfers',
      { params },
    )
  },

  receiveTransfer(id: string, note?: string) {
    return warehouseClient.post<Envelope<{ transfer: WarehouseTransfer }>>(
      `/inventory/transfers/${id}/receive`,
      note ? { note } : {},
    )
  },

  approveTransfer(id: string, note?: string) {
    return warehouseClient.post<
      Envelope<{
        transfer: WarehouseTransfer
        fromWarehouse: InventoryStock | null
        toWarehouse: InventoryStock | null
      }>
    >(`/inventory/transfers/${id}/approve`, note ? { note } : {})
  },

  rejectTransfer(id: string, note?: string) {
    return warehouseClient.post<Envelope<WarehouseTransfer>>(
      `/inventory/transfers/${id}/reject`,
      note ? { note } : {},
    )
  },

  listMovements(params?: {
    productId?: string
    warehouseId?: string
    movementType?: string
    limit?: number
  }) {
    return warehouseClient.get<Envelope<InventoryMovement[]>>(
      '/inventory/movements',
      { params },
    )
  },

  // --- Purchasing (suppliers, purchase orders, receipts, returns) ---

  listSuppliers(params?: { status?: SupplierStatus | '' }) {
    return warehouseClient.get<Envelope<Supplier[]>>('/suppliers', {
      params: params?.status ? { status: params.status } : {},
    })
  },

  getSupplier(id: string) {
    return warehouseClient.get<Envelope<Supplier>>(`/suppliers/${id}`)
  },

  createSupplier(payload: SupplierPayload) {
    return warehouseClient.post<Envelope<Supplier>>('/suppliers', payload)
  },

  updateSupplier(id: string, payload: Partial<SupplierPayload>) {
    return warehouseClient.patch<Envelope<Supplier>>(`/suppliers/${id}`, payload)
  },

  deleteSupplier(id: string) {
    return warehouseClient.delete<{ success: boolean }>(`/suppliers/${id}`)
  },

  listPurchaseOrders(params?: {
    status?: PurchaseOrderStatus | ''
    supplierId?: string
    warehouseId?: string
    limit?: number
  }) {
    return warehouseClient.get<Envelope<PurchaseOrder[]>>('/purchase-orders', {
      params: {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.supplierId ? { supplierId: params.supplierId } : {}),
        ...(params?.warehouseId ? { warehouseId: params.warehouseId } : {}),
        ...(params?.limit ? { limit: params.limit } : {}),
      },
    })
  },

  getPurchaseOrder(id: string) {
    return warehouseClient.get<Envelope<PurchaseOrder>>(`/purchase-orders/${id}`)
  },

  createPurchaseOrder(payload: PurchaseOrderPayload) {
    return warehouseClient.post<Envelope<PurchaseOrder>>(
      '/purchase-orders',
      payload,
    )
  },

  downloadPurchaseOrderAttachment(orderId: string, attachmentId: string) {
    return warehouseClient.get<Blob>(
      `/purchase-orders/${orderId}/attachments/${attachmentId}`,
      { responseType: 'blob' },
    )
  },

  receiveSupplierOrder(id: string) {
    return warehouseClient.post<Envelope<PurchaseOrder>>(
      `/purchase-orders/${id}/receive-supplier`,
    )
  },

  markPurchaseOrderRouteArrived(id: string) {
    return warehouseClient.post<Envelope<PurchaseOrder>>(
      `/purchase-orders/${id}/route-arrived`,
    )
  },

  deliveryPickup(id: string) {
    return warehouseClient.post<Envelope<PurchaseOrder>>(
      `/purchase-orders/${id}/delivery-pickup`,
    )
  },

  deliveryProcess(
    id: string,
    payload: {
      notes?: string | null
      items: Array<{
        purchaseOrderItemId: string
        confirmedQty: number
        variationCorrect: boolean
        notes?: string | null
      }>
    },
  ) {
    return warehouseClient.post<Envelope<PurchaseOrder>>(
      `/purchase-orders/${id}/delivery-process`,
      payload,
    )
  },

  sellerReceiveDelivery(id: string) {
    return warehouseClient.post<Envelope<PurchaseOrder>>(
      `/purchase-orders/${id}/seller-receive`,
    )
  },

  createDamageReport(
    purchaseOrderId: string,
    payload: {
      notes?: string | null
      items: Array<{
        purchaseOrderItemId?: string | null
        productId: string
        variantId?: string
        productName?: string | null
        quantity: number
        damageType?: string | null
        notes?: string | null
      }>
    },
  ) {
    return warehouseClient.post(`/purchase-orders/${purchaseOrderId}/damage-reports`, payload)
  },

  listDamageReports(params?: { purchaseOrderId?: string }) {
    return warehouseClient.get('/damage-reports', {
      params: {
        ...(params?.purchaseOrderId ? { purchaseOrderId: params.purchaseOrderId } : {}),
      },
    })
  },

  getDamageReport(id: string) {
    return warehouseClient.get(`/damage-reports/${id}`)
  },

  confirmDamageReport(id: string) {
    return warehouseClient.post(`/damage-reports/${id}/confirm`)
  },

  updatePurchaseOrderStatus(
    id: string,
    status: PurchaseOrderStatus,
    note?: string,
  ) {
    return warehouseClient.patch<Envelope<PurchaseOrder>>(
      `/purchase-orders/${id}/status`,
      note ? { status, note } : { status },
    )
  },

  listDeliveryStages(purchaseOrderId: string) {
    return warehouseClient.get<Envelope<PurchaseDeliveryStage[]>>(
      `/purchase-orders/${purchaseOrderId}/delivery-stages`,
    )
  },

  createDeliveryStage(
    purchaseOrderId: string,
    payload: PurchaseDeliveryStagePayload,
  ) {
    return warehouseClient.post<Envelope<PurchaseDeliveryStage>>(
      `/purchase-orders/${purchaseOrderId}/delivery-stages`,
      payload,
    )
  },

  listAdditionalCosts(purchaseOrderId: string) {
    return warehouseClient.get<Envelope<PurchaseAdditionalCost[]>>(
      `/purchase-orders/${purchaseOrderId}/additional-costs`,
    )
  },

  createAdditionalCost(
    purchaseOrderId: string,
    payload: PurchaseAdditionalCostPayload,
  ) {
    return warehouseClient.post<Envelope<PurchaseAdditionalCost>>(
      `/purchase-orders/${purchaseOrderId}/additional-costs`,
      payload,
    )
  },

  listCostAdjustments(purchaseOrderId: string) {
    return warehouseClient.get<Envelope<PurchaseCostAdjustment[]>>(
      `/purchase-orders/${purchaseOrderId}/cost-adjustments`,
    )
  },

  createCostAdjustment(
    purchaseOrderId: string,
    payload: PurchaseCostAdjustmentPayload,
  ) {
    return warehouseClient.post<Envelope<PurchaseCostAdjustment>>(
      `/purchase-orders/${purchaseOrderId}/cost-adjustments`,
      payload,
    )
  },

  applyCostAdjustment(id: string) {
    return warehouseClient.post<Envelope<PurchaseCostAdjustment>>(
      `/purchase-cost-adjustments/${id}/apply`,
    )
  },

  listPurchaseReceipts(params?: {
    purchaseOrderId?: string
    warehouseId?: string
    status?: PurchaseReceiptStatus | ''
    limit?: number
  }) {
    return warehouseClient.get<Envelope<PurchaseReceipt[]>>(
      '/purchase-receipts',
      {
        params: {
          ...(params?.purchaseOrderId
            ? { purchaseOrderId: params.purchaseOrderId }
            : {}),
          ...(params?.warehouseId ? { warehouseId: params.warehouseId } : {}),
          ...(params?.status ? { status: params.status } : {}),
          ...(params?.limit ? { limit: params.limit } : {}),
        },
      },
    )
  },

  getPurchaseReceipt(id: string) {
    return warehouseClient.get<Envelope<PurchaseReceipt>>(
      `/purchase-receipts/${id}`,
    )
  },

  createPurchaseReceipt(payload: PurchaseReceiptPayload) {
    return warehouseClient.post<Envelope<PurchaseReceipt>>(
      '/purchase-receipts',
      payload,
    )
  },

  confirmPurchaseReceipt(id: string) {
    return warehouseClient.post<Envelope<PurchaseReceipt>>(
      `/purchase-receipts/${id}/confirm`,
    )
  },

  listPurchaseReturns(params?: {
    supplierId?: string
    warehouseId?: string
    status?: PurchaseReturnStatus | ''
    limit?: number
  }) {
    return warehouseClient.get<Envelope<PurchaseReturn[]>>(
      '/purchase-returns',
      {
        params: {
          ...(params?.supplierId ? { supplierId: params.supplierId } : {}),
          ...(params?.warehouseId ? { warehouseId: params.warehouseId } : {}),
          ...(params?.status ? { status: params.status } : {}),
          ...(params?.limit ? { limit: params.limit } : {}),
        },
      },
    )
  },

  getPurchaseReturn(id: string) {
    return warehouseClient.get<Envelope<PurchaseReturn>>(
      `/purchase-returns/${id}`,
    )
  },

  createPurchaseReturn(payload: PurchaseReturnPayload) {
    return warehouseClient.post<Envelope<PurchaseReturn>>(
      '/purchase-returns',
      payload,
    )
  },

  postPurchaseReturn(id: string) {
    return warehouseClient.post<Envelope<PurchaseReturn>>(
      `/purchase-returns/${id}/post`,
    )
  },
}
