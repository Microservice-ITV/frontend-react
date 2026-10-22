import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Package, PackageCheck, Truck } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { secondaryButtonClass } from '../config/purchaseUiClasses'
import type { PurchaseOrder } from '../types/purchaseTypes'

const isSupplierOrder = (order: PurchaseOrder) => order.orderKind !== 'WAREHOUSE'

const DeliveryOverviewPage = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [damageCount, setDamageCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ordersResponse, damageResponse] = await Promise.all([
        purchaseApi.listPurchaseOrders({ limit: 500 }),
        purchaseApi.listDamageReports(),
      ])
      const supplierOrders = (ordersResponse.data?.data ?? []).filter(isSupplierOrder)
      setOrders(supplierOrders)
      setDamageCount((damageResponse.data?.data ?? []).length)
    } catch (err) {
      setOrders([])
      setDamageCount(0)
      setError(purchaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(() => {
    // Seller transit → ARRIVED → confirm+pickup → AWAITING_WAREHOUSE_RECEIPT.
    const inTransit = orders.filter(
      (order) => order.status === 'IN_TRANSIT' || order.status === 'ORDERED',
    ).length
    const awaitingConfirm = orders.filter(
      (order) => order.status === 'ARRIVED' || order.status === 'DELIVERY_PICKED_UP',
    ).length
    const sentToWarehouse = orders.filter(
      (order) =>
        order.status === 'AWAITING_WAREHOUSE_RECEIPT' ||
        order.status === 'WAREHOUSE_RECEIVED' ||
        order.status === 'AWAITING_SELLER_RECEIPT' ||
        order.status === 'SELLER_RECEIVED',
    ).length
    return { inTransit, awaitingConfirm, sentToWarehouse }
  }, [orders])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Delivery overview</h1>
          <p className="text-sm text-slate-500">
            Watch seller transit updates. After final arrival, confirm and pickup, then the parcel goes
            to the warehouse manager.
          </p>
        </div>
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={loading}
          onClick={() => void load()}
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Seller in transit"
          value={loading ? '—' : String(stats.inTransit)}
          icon={Truck}
          hint="Seller confirming route stops"
        />
        <StatCard
          title="Confirm and Pickup"
          value={loading ? '—' : String(stats.awaitingConfirm)}
          icon={Package}
          hint="Arrived — ready for agent"
        />
        <StatCard
          title="Sent to warehouse"
          value={loading ? '—' : String(stats.sentToWarehouse)}
          icon={PackageCheck}
          hint="Awaiting warehouse receipt + received"
        />
        <StatCard
          title="Damage reports"
          value={loading ? '—' : String(damageCount)}
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/delivery-agent/parcels"
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"
        >
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <Package size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Parcels</p>
              <p className="text-xs text-slate-500">
                See seller transit status, pick up when arrived, and send to warehouse.
              </p>
            </div>
          </div>
        </Link>
        <Link
          to="/delivery-agent/damage-reports"
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"
        >
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-amber-100 p-2 text-amber-700">
              <AlertTriangle size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Damage reports</p>
              <p className="text-xs text-slate-500">
                Review damage reports you submitted to sellers.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default DeliveryOverviewPage
