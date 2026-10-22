import {
  warehouseApi,
  warehouseErrorMessage,
} from '@/features/warehouse/api/warehouseApi'

/**
 * Purchase-domain facade. All calls are proxied to `warehouseApi`, which is the
 * single access point for the warehouse-service — there is no purchase service.
 */
export const purchaseErrorMessage = warehouseErrorMessage

export const purchaseApi = {
  listSuppliers: warehouseApi.listSuppliers,
  getSupplier: warehouseApi.getSupplier,
  createSupplier: warehouseApi.createSupplier,
  updateSupplier: warehouseApi.updateSupplier,
  deleteSupplier: warehouseApi.deleteSupplier,

  listPurchaseOrders: warehouseApi.listPurchaseOrders,
  getPurchaseOrder: warehouseApi.getPurchaseOrder,
  createPurchaseOrder: warehouseApi.createPurchaseOrder,
  downloadPurchaseOrderAttachment: warehouseApi.downloadPurchaseOrderAttachment,
  updatePurchaseOrderStatus: warehouseApi.updatePurchaseOrderStatus,
  receiveSupplierOrder: warehouseApi.receiveSupplierOrder,
  markPurchaseOrderRouteArrived: warehouseApi.markPurchaseOrderRouteArrived,
  deliveryPickup: warehouseApi.deliveryPickup,
  deliveryProcess: warehouseApi.deliveryProcess,
  sellerReceiveDelivery: warehouseApi.sellerReceiveDelivery,
  createDamageReport: warehouseApi.createDamageReport,
  listDamageReports: warehouseApi.listDamageReports,
  getDamageReport: warehouseApi.getDamageReport,
  confirmDamageReport: warehouseApi.confirmDamageReport,

  listDeliveryStages: warehouseApi.listDeliveryStages,
  createDeliveryStage: warehouseApi.createDeliveryStage,
  listAdditionalCosts: warehouseApi.listAdditionalCosts,
  createAdditionalCost: warehouseApi.createAdditionalCost,
  listCostAdjustments: warehouseApi.listCostAdjustments,
  createCostAdjustment: warehouseApi.createCostAdjustment,
  applyCostAdjustment: warehouseApi.applyCostAdjustment,

  listPurchaseReceipts: warehouseApi.listPurchaseReceipts,
  getPurchaseReceipt: warehouseApi.getPurchaseReceipt,
  createPurchaseReceipt: warehouseApi.createPurchaseReceipt,
  confirmPurchaseReceipt: warehouseApi.confirmPurchaseReceipt,

  listPurchaseReturns: warehouseApi.listPurchaseReturns,
  getPurchaseReturn: warehouseApi.getPurchaseReturn,
  createPurchaseReturn: warehouseApi.createPurchaseReturn,
  postPurchaseReturn: warehouseApi.postPurchaseReturn,
}
