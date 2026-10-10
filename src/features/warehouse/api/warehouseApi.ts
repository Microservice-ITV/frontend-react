import type { AxiosError } from 'axios'
import { warehouseClient } from '@/lib/api/warehouseClient'
import type {
  InventoryMovement,
  InventoryStock,
  StockMutationPayload,
  TransferPayload,
  Warehouse,
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
  listWarehouses(params?: { status?: WarehouseStatus | ''; shopId?: string }) {
    return warehouseClient.get<Envelope<Warehouse[]>>('/warehouses', {
      params: {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.shopId ? { shopId: params.shopId } : {}),
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

  approveTransfer(id: string, note?: string) {
    return warehouseClient.post<
      Envelope<{
        transfer: WarehouseTransfer
        fromWarehouse: InventoryStock
        toWarehouse: InventoryStock
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
