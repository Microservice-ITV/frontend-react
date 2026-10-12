export type WarehouseAreaBase = '/seller' | '/super-admin'

export const warehousePaths = (base: WarehouseAreaBase) => ({
  root: `${base}/warehouse`,
  overview: `${base}/warehouse`,
  warehouses: `${base}/warehouse/warehouses`,
  inventory: `${base}/warehouse/inventory`,
  transfer: `${base}/warehouse/transfer`,
  movements: `${base}/warehouse/movements`,
})

export type WarehousePaths = ReturnType<typeof warehousePaths>
