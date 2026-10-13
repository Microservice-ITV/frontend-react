export type PurchaseAreaBase = '/seller' | '/super-admin' | '/warehouse-manager'

export const purchasePaths = (base: PurchaseAreaBase) => ({
  root: `${base}/warehouse`,
  suppliers: `${base}/warehouse/suppliers`,
  supplierNew: `${base}/warehouse/suppliers/new`,
  supplierDetail: (id: string) => `${base}/warehouse/suppliers/${id}`,
  supplierEdit: (id: string) => `${base}/warehouse/suppliers/${id}/edit`,
  orders: `${base}/warehouse/purchase-orders`,
  newOrder: `${base}/warehouse/purchase-orders/new`,
  warehouseOrder: `${base}/warehouse/orders/new`,
  receipts: `${base}/warehouse/receipts`,
  returns: `${base}/warehouse/returns`,
})

export type PurchasePaths = ReturnType<typeof purchasePaths>