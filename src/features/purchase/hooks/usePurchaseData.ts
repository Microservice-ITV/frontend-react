import { useCallback, useEffect, useState } from 'react'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseReceipt,
  PurchaseReceiptStatus,
  PurchaseReturn,
  PurchaseReturnStatus,
  Supplier,
  SupplierStatus,
} from '../types/purchaseTypes'

export const useSuppliers = (params?: { status?: SupplierStatus | '' }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const status = params?.status ?? ''

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await purchaseApi.listSuppliers({ status })
      setSuppliers(response.data?.data ?? [])
    } catch (err) {
      setSuppliers([])
      setError(purchaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  return { suppliers, loading, error, reload: load }
}

export const usePurchaseOrders = (params?: {
  status?: PurchaseOrderStatus | ''
  supplierId?: string
  warehouseId?: string
  limit?: number
}) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const status = params?.status ?? ''
  const supplierId = params?.supplierId ?? ''
  const warehouseId = params?.warehouseId ?? ''
  const limit = params?.limit

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await purchaseApi.listPurchaseOrders({
        status,
        supplierId,
        warehouseId,
        limit,
      })
      setOrders(response.data?.data ?? [])
    } catch (err) {
      setOrders([])
      setError(purchaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [status, supplierId, warehouseId, limit])

  useEffect(() => {
    void load()
  }, [load])

  return { orders, loading, error, reload: load }
}

export const usePurchaseReceipts = (params?: {
  status?: PurchaseReceiptStatus | ''
  purchaseOrderId?: string
  warehouseId?: string
}) => {
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const status = params?.status ?? ''
  const purchaseOrderId = params?.purchaseOrderId ?? ''
  const warehouseId = params?.warehouseId ?? ''

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await purchaseApi.listPurchaseReceipts({
        status,
        purchaseOrderId,
        warehouseId,
      })
      setReceipts(response.data?.data ?? [])
    } catch (err) {
      setReceipts([])
      setError(purchaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [status, purchaseOrderId, warehouseId])

  useEffect(() => {
    void load()
  }, [load])

  return { receipts, loading, error, reload: load }
}

export const usePurchaseReturns = (params?: {
  status?: PurchaseReturnStatus | ''
  supplierId?: string
  warehouseId?: string
}) => {
  const [returns, setReturns] = useState<PurchaseReturn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const status = params?.status ?? ''
  const supplierId = params?.supplierId ?? ''
  const warehouseId = params?.warehouseId ?? ''

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await purchaseApi.listPurchaseReturns({
        status,
        supplierId,
        warehouseId,
      })
      setReturns(response.data?.data ?? [])
    } catch (err) {
      setReturns([])
      setError(purchaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [status, supplierId, warehouseId])

  useEffect(() => {
    void load()
  }, [load])

  return { returns, loading, error, reload: load }
}