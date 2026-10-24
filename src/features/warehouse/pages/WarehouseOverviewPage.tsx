import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  PackageCheck,
  ScrollText,
  ShoppingCart,
  Warehouse as WarehouseIcon,
  Wallet,
  XCircle,
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterBar from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import ShopSelector from '../components/ShopSelector'
import { StockStatusBadge } from '../components/StockStatusBadge'
import { warehouseApi, warehouseErrorMessage } from '../api/warehouseApi'
import { warehousePaths, type WarehouseAreaBase } from '../config/warehousePaths'
import { filterInventoryRows, useInventoryRows, useWarehouses } from '../hooks/useWarehouseData'
import { productLabel, useProductNames } from '../hooks/useProductNames'
import {
  MOVEMENT_TYPE_LABELS,
  type InventoryMovement,
  type InventoryRow,
} from '../types/warehouseTypes'
import { purchasePaths } from '@/features/purchase/config/purchasePaths'
import { purchaseApi, purchaseErrorMessage } from '@/features/purchase/api/purchaseApi'
import { usePurchaseOrders } from '@/features/purchase/hooks/usePurchaseData'
import { PurchaseOrderStatusBadge } from '@/features/purchase/components/PurchaseBadges'
import PurchaseOrderDetailsPanel from '@/features/purchase/components/PurchaseOrderDetailsPanel'
import { downloadPurchaseOrderAttachment } from '@/features/purchase/utils/downloadPurchaseOrderAttachment'
import {
  formatMoney,
  type PurchaseOrder,
} from '@/features/purchase/types/purchaseTypes'

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfMonthValue = () => {
  const now = new Date()
  return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1))
}

const todayValue = () => toDateInputValue(new Date())

const orderDay = (order: PurchaseOrder) =>
  (order.orderDate || order.createdAt || '').slice(0, 10)

/** Drafts / cancelled are not capital spent yet. */
const isCapitalOrder = (order: PurchaseOrder) =>
  order.orderKind !== 'WAREHOUSE' &&
  order.status !== 'DRAFT' &&
  order.status !== 'CANCELLED'

export type WarehouseOverviewPageProps = {
  base: WarehouseAreaBase
  platform?: boolean
}

const movementTone = (movementType: InventoryMovement['movementType']) => {
  if (movementType === 'TRANSFER_IN' || movementType === 'PURCHASE_RECEIVED') {
    return 'success' as const
  }
  if (movementType === 'TRANSFER_OUT' || movementType === 'SALE_ISSUED') {
    return 'danger' as const
  }
  return 'neutral' as const
}

const WarehouseOverviewPage = ({ base, platform = false }: WarehouseOverviewPageProps) => {
  const paths = warehousePaths(base)
  const purchase = purchasePaths(base)
  const [shopId, setShopId] = useState('')
  const [search, setSearch] = useState('')
  const [availability, setAvailability] = useState('')
  const [poDateFrom, setPoDateFrom] = useState(startOfMonthValue)
  const [poDateTo, setPoDateTo] = useState(todayValue)
  const [poDetails, setPoDetails] = useState<PurchaseOrder | null>(null)
  const [poDetailsLoading, setPoDetailsLoading] = useState(false)
  const [poDetailsError, setPoDetailsError] = useState<string | null>(null)
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [movementsError, setMovementsError] = useState<string | null>(null)
  const [movementsLoading, setMovementsLoading] = useState(true)

  const isSeller = base === '/seller'
  const { warehouses, loading: warehousesLoading, error: warehousesError } = useWarehouses(
    isSeller
      ? { status: 'ACTIVE', includePurchased: true }
      : platform
        ? { shopId }
        : undefined,
  )
  const {
    rows,
    loading: inventoryLoading,
    error: inventoryError,
  } = useInventoryRows(warehouses)
  const productNames = useProductNames()
  const {
    orders: purchaseOrders,
    loading: purchaseOrdersLoading,
    error: purchaseOrdersError,
  } = usePurchaseOrders({ limit: 500 })

  const capitalOrders = useMemo(() => {
    return purchaseOrders
      .filter(isCapitalOrder)
      .filter((order) => {
        const day = orderDay(order)
        if (!day) return false
        if (poDateFrom && day < poDateFrom) return false
        if (poDateTo && day > poDateTo) return false
        return true
      })
      .sort((a, b) => orderDay(b).localeCompare(orderDay(a)))
  }, [purchaseOrders, poDateFrom, poDateTo])

  const capitalTotal = useMemo(
    () =>
      capitalOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0),
    [capitalOrders],
  )

  const openPurchaseOrderDetails = useCallback(
    async (id: string, preview?: PurchaseOrder) => {
      setPoDetails(preview ?? null)
      setPoDetailsLoading(true)
      setPoDetailsError(null)
      try {
        const response = await purchaseApi.getPurchaseOrder(id)
        setPoDetails(response.data?.data ?? preview ?? null)
      } catch (err) {
        setPoDetailsError(purchaseErrorMessage(err))
        if (!preview) setPoDetails(null)
      } finally {
        setPoDetailsLoading(false)
      }
    },
    [],
  )

  const loadMovements = useCallback(async () => {
    setMovementsLoading(true)
    setMovementsError(null)
    try {
      const response = await warehouseApi.listMovements({ limit: 10 })
      setMovements(response.data?.data ?? [])
    } catch (err) {
      setMovements([])
      setMovementsError(warehouseErrorMessage(err))
    } finally {
      setMovementsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMovements()
  }, [loadMovements])

  const visibleRows = filterInventoryRows(rows, {
    search,
    warehouseId: '',
    availability: availability as InventoryRow['availabilityStatus'] | '',
    productNames,
  })

  const lowStock = rows.filter((row) => row.availabilityStatus === 'LOW_STOCK')
  const outOfStock = rows.filter((row) => row.availabilityStatus === 'OUT_OF_STOCK')
  const unitsOnHand = rows.reduce((total, row) => total + row.onHandQty, 0)
  const productsTracked = new Set(rows.map((row) => row.productId)).size
  const loading = warehousesLoading || inventoryLoading
  const error = warehousesError ?? inventoryError

  const movementColumns: Array<DataTableColumn<InventoryMovement>> = [
    {
      key: 'createdAt',
      header: 'Date',
      width: '160px',
      sortValue: (row) => row.createdAt,
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'movementType',
      header: 'Type',
      width: '160px',
      sortValue: (row) => row.movementType,
      render: (row) => (
        <StatusBadge
          label={MOVEMENT_TYPE_LABELS[row.movementType]}
          tone={movementTone(row.movementType)}
        />
      ),
    },
    {
      key: 'productId',
      header: 'Product',
      sortValue: (row) => productLabel(productNames, row.productId),
      render: (row) => (
           <span
             className="block max-w-[320px] truncate text-sm font-medium text-slate-700"
             title={productLabel(productNames, row.productId)}
           >
             {productLabel(productNames, row.productId)}
           </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'right',
      width: '90px',
      sortValue: (row) => row.quantity,
      render: (row) => (
        <span
          className={
            row.quantity < 0 ? 'font-medium text-rose-600' : 'font-medium text-emerald-600'
          }
        >
          {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
        </span>
      ),
    },
    {
      key: 'movement',
      header: 'Before → After',
      align: 'right',
      width: '140px',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.beforeQty} → {row.afterQty}
        </span>
      ),
    },
  ]

  const purchaseColumns: Array<DataTableColumn<PurchaseOrder>> = [
    {
      key: 'orderNumber',
      header: 'Order',
      sortValue: (row) => row.orderNumber,
      render: (row) => (
        <div>
          <p className="whitespace-nowrap font-medium text-[var(--dni-primary)]">
            {row.orderNumber}
          </p>
          <p className="truncate text-xs text-slate-400">
            {row.supplier?.name ?? 'Supplier order'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '150px',
      sortValue: (row) => row.status,
      render: (row) => <PurchaseOrderStatusBadge status={row.status} />,
    },
    {
      key: 'totalAmount',
      header: 'Capital',
      align: 'right',
      width: '140px',
      sortValue: (row) => Number(row.totalAmount),
      render: (row) => (
        <span className="font-medium text-slate-800">{formatMoney(row.totalAmount)}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Ordered',
      width: '120px',
      sortValue: (row) => orderDay(row),
      render: (row) => (
        <span className="text-xs text-slate-500">
          {orderDay(row)
            ? new Date(`${orderDay(row)}T00:00:00`).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
  ]

  const stockColumns: Array<DataTableColumn<InventoryRow>> = [
    {
      key: 'productId',
      header: 'Product',
      sortValue: (row) => productLabel(productNames, row.productId),
      render: (row) => (
        <div className="min-w-0">
           <span
             className="block max-w-[320px] truncate text-sm font-medium text-slate-700"
             title={productLabel(productNames, row.productId)}
           >
             {productLabel(productNames, row.productId)}
           </span>
          <span className="text-xs text-slate-400">{row.warehouseName}</span>
        </div>
      ),
    },
    {
      key: 'onHand',
      header: 'On hand',
      align: 'right',
      width: '100px',
      sortValue: (row) => row.onHandQty,
      render: (row) => <span className="font-medium text-slate-800">{row.onHandQty}</span>,
    },
    {
      key: 'available',
      header: 'Available',
      align: 'right',
      width: '100px',
      sortValue: (row) => row.availableQty,
      render: (row) => <span className="text-slate-600">{row.availableQty}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      sortValue: (row) => row.availabilityStatus,
      render: (row) => <StockStatusBadge status={row.availabilityStatus} />,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      width: '110px',
      render: () => (
        <Link
          to={paths.inventory}
          className="text-xs font-medium text-[var(--dni-primary)] hover:underline"
        >
          Manage
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <span>Dashboard</span> <span className="mx-1">/</span>
        <span className="text-slate-700">Warehouse</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Warehouse Overview</h1>
          <p className="text-sm text-slate-500">
            Stock health across {warehouses.length} warehouse
            {warehouses.length === 1 ? '' : 's'}.
          </p>
        </div>
        {platform && <ShopSelector value={shopId} onChange={setShopId} />}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Warehouses"
          value={warehouses.length}
          icon={WarehouseIcon}
          tone="brand"
          hint={`${warehouses.filter((warehouse) => warehouse.status === 'ACTIVE').length} active`}
          loading={loading}
        />
        <StatCard
          title="Products tracked"
          value={productsTracked}
          icon={Boxes}
          tone="info"
          loading={loading}
        />
        <StatCard
          title="Units on hand"
          value={unitsOnHand.toLocaleString()}
          icon={PackageCheck}
          tone="brand"
          loading={loading}
        />
        <StatCard
          title="Low stock"
          value={lowStock.length}
          icon={AlertTriangle}
          tone="warning"
          hint="5 or fewer available"
          loading={loading}
        />
        <StatCard
          title="Out of stock"
          value={outOfStock.length}
          icon={XCircle}
          tone="danger"
          loading={loading}
        />
        <StatCard
          title="Inventory Movements"
          value={movements.length}
          icon={ScrollText}
          tone="neutral"
          hint="latest ledger entries"
          loading={movementsLoading}
        />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Purchase capital</h2>
            <p className="text-xs text-slate-500">
              Supplier purchase orders in the selected date range (drafts and cancelled
              excluded).
            </p>
          </div>
          <Link
            to={purchase.orders}
            className="group inline-flex items-center gap-1 text-xs font-medium text-[var(--dni-primary)] transition hover:gap-1.5 hover:underline"
          >
            View all purchase orders
            <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Date range
          </span>
          <input
            type="date"
            value={poDateFrom}
            onChange={(event) => setPoDateFrom(event.target.value)}
            onClick={(event) => {
              const input = event.currentTarget
              if (typeof input.showPicker === 'function') {
                try {
                  input.showPicker()
                } catch {
                  /* browser may reject if not triggered by a user gesture edge case */
                }
              }
            }}
            className="w-[150px] cursor-pointer rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[var(--dni-primary)] focus:ring-1 focus:ring-[var(--dni-primary)]"
            aria-label="From date"
          />
          <span className="text-xs text-slate-400">→</span>
          <input
            type="date"
            value={poDateTo}
            onChange={(event) => setPoDateTo(event.target.value)}
            onClick={(event) => {
              const input = event.currentTarget
              if (typeof input.showPicker === 'function') {
                try {
                  input.showPicker()
                } catch {
                  /* ignore */
                }
              }
            }}
            className="w-[150px] cursor-pointer rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[var(--dni-primary)] focus:ring-1 focus:ring-[var(--dni-primary)]"
            aria-label="To date"
          />
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800"
            onClick={() => {
              setPoDateFrom(startOfMonthValue())
              setPoDateTo(todayValue())
            }}
          >
            <CalendarDays size={14} className="shrink-0" />
            This month
          </button>
        </div>

        {purchaseOrdersError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {purchaseOrdersError}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            title="Capital purchased"
            value={formatMoney(capitalTotal)}
            icon={CircleDollarSign}
            tone="success"
            hint={`${capitalOrders.length} purchase order${capitalOrders.length === 1 ? '' : 's'} in range`}
            loading={purchaseOrdersLoading}
          />
          <StatCard
            title="Purchase orders"
            value={capitalOrders.length}
            icon={ShoppingCart}
            tone="info"
            hint="Supplier POs only"
            loading={purchaseOrdersLoading}
          />
        </div>

        <DataTable<PurchaseOrder>
          columns={purchaseColumns}
          rows={capitalOrders}
          rowKey={(row) => row.id}
          loading={purchaseOrdersLoading}
          error={purchaseOrdersError}
          emptyMessage="No purchase orders in this date range."
          emptyIcon={ShoppingCart}
          initialRowsPerPage={5}
          itemLabel="orders"
          minWidth="720px"
          onRowClick={(row) => void openPurchaseOrderDetails(row.id, row)}
        />

        <div className="flex justify-end">
          <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Wallet size={16} className="shrink-0 text-slate-500" />
            <span className="text-sm text-slate-600">Combined purchase total</span>
            <span className="text-base font-bold text-slate-900">
              {purchaseOrdersLoading ? '—' : `Ks ${formatMoney(capitalTotal)}`}
            </span>
          </div>
        </div>

        {poDetails && (
          <ModalDrawer
            open
            onClose={() => {
              setPoDetails(null)
              setPoDetailsError(null)
            }}
            title={poDetails.orderNumber}
            subtitle={
              poDetails.supplier?.name
                ? `Supplier: ${poDetails.supplier.name}`
                : undefined
            }
            size="xl"
          >
            <PurchaseOrderDetailsPanel
              order={poDetails}
              loading={poDetailsLoading}
              error={poDetailsError}
              onDownloadAttachment={(orderId, file) =>
                void downloadPurchaseOrderAttachment(orderId, file)
              }
            />
          </ModalDrawer>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Recent inventory movements</h2>
        <DataTable<InventoryMovement>
          columns={movementColumns}
          rows={movements}
          rowKey={(row) => row.id}
          loading={movementsLoading}
          error={movementsError}
          emptyMessage="No inventory movements recorded yet."
          emptyIcon={ScrollText}
          initialRowsPerPage={5}
          itemLabel="movements"
          minWidth="720px"
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800">Stock needing attention</h2>
          <div className="w-full max-w-xl">
            <FilterBar
              search={{
                value: search,
                onChange: setSearch,
                placeholder: 'Search product or warehouse…',
              }}
              selects={[
                {
                  key: 'availability',
                  label: 'Status',
                  value: availability,
                  allLabel: 'All statuses',
                  onChange: setAvailability,
                  options: [
                    { value: 'IN_STOCK', label: 'In Stock' },
                    { value: 'LOW_STOCK', label: 'Low Stock' },
                    { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
                  ],
                  className: 'min-w-[160px] flex-none',
                },
              ]}
            />
          </div>
        </div>

        <DataTable<InventoryRow>
          columns={stockColumns}
          rows={visibleRows}
          rowKey={(row) => row.id}
          loading={loading}
          error={error}
          emptyMessage="No stock matches these filters."
          initialRowsPerPage={5}
          itemLabel="stock rows"
          minWidth="860px"
          fixedLayout
        />
      </section>
    </div>
  )
}

export default WarehouseOverviewPage
