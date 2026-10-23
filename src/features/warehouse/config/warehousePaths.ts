export type WarehouseAreaBase = '/seller' | '/super-admin' | '/warehouse-manager'

export const warehousePaths = (base: WarehouseAreaBase) => ({
  root: `${base}/warehouse`,
  overview: `${base}/warehouse`,
  warehouses: `${base}/warehouse/warehouses`,
  warehouseNew: `${base}/warehouse/warehouses/new`,
  warehouseDetail: (id: string) => `${base}/warehouse/warehouses/${id}`,
  warehouseEdit: (id: string) => `${base}/warehouse/warehouses/${id}/edit`,
  inventory: `${base}/warehouse/inventory`,
  inventoryEdit: `${base}/warehouse/inventory/edit`,
  transfer: `${base}/warehouse/transfer`,
  movements: `${base}/warehouse/movements`,
})

export type WarehousePaths = ReturnType<typeof warehousePaths>
