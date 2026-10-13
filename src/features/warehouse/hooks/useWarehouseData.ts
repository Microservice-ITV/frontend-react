import { useCallback, useEffect, useState } from 'react'
import { warehouseApi, warehouseErrorMessage } from '../api/warehouseApi'
import {
  resolveAvailability,
  type AvailabilityStatus,
  type InventoryRow,
  type Warehouse,
} from '../types/warehouseTypes'

export const useWarehouses = (params?: {
  status?: string
  shopId?: string
  catalog?: boolean
  includePurchased?: boolean
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const status = params?.status ?? ''
  const shopId = params?.shopId ?? ''
  const catalog = params?.catalog ?? false
  const includePurchased = params?.includePurchased ?? false

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await warehouseApi.listWarehouses({
        status: status as '' | 'ACTIVE' | 'INACTIVE',
        shopId,
        catalog,
        includePurchased,
      })
      setWarehouses(response.data?.data ?? [])
    } catch (err) {
      setWarehouses([])
      setError(warehouseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [status, shopId, catalog, includePurchased])

  useEffect(() => {
    void load()
  }, [load])

  return { warehouses, loading, error, reload: load }
}

export const useInventoryRows = (warehouses: Warehouse[], enabled = true) => {
  const [rows, setRows] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const warehouseKey = warehouses.map((warehouse) => warehouse.id).join(',')

  const load = useCallback(async () => {
    if (!enabled || warehouseKey === '') {
      setRows([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const targets = warehouseKey.split(',').filter(Boolean)
      const results = await Promise.all(
        targets.map((warehouseId) => warehouseApi.listInventory(warehouseId)),
      )

      const nextRows: InventoryRow[] = []
      results.forEach((result, index) => {
        const warehouseId = targets[index]
        const warehouseName =
          warehouses.find((item) => item.id === warehouseId)?.name ?? warehouseId
        const stocks = result.data?.data ?? []
        stocks.forEach((stock) => {
          nextRows.push({
            ...stock,
            warehouseName,
            availabilityStatus: resolveAvailability(stock),
          })
        })
      })

      setRows(nextRows)
    } catch (err) {
      setRows([])
      setError(warehouseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [warehouseKey, enabled, warehouses])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseKey, enabled])

  return { rows, loading, error, reload: load }
}

export type InventoryFilter = {
  search: string
  warehouseId: string
  availability: AvailabilityStatus | ''
  productNames?: Record<string, string>
}

export const filterInventoryRows = (
  rows: InventoryRow[],
  filter: InventoryFilter,
): InventoryRow[] => {
  const search = filter.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (filter.warehouseId && row.warehouseId !== filter.warehouseId) return false
    if (filter.availability && row.availabilityStatus !== filter.availability) {
      return false
    }
    if (search) {
      const haystack = `${row.productId} ${
        filter.productNames?.[row.productId] ?? ''
      } ${row.variantId} ${row.warehouseName}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}
