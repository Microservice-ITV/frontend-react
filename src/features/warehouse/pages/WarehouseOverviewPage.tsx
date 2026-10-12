import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Boxes,
  PackageCheck,
  ScrollText,
  Warehouse as WarehouseIcon,
  XCircle,
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterBar from '@/components/ui/FilterBar'
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
  const [shopId, setShopId] = useState('')
  const [search, setSearch] = useState('')
  const [availability, setAvailability] = useState('')
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [movementsError, setMovementsError] = useState<string | null>(null)
  const [movementsLoading, setMovementsLoading] = useState(true)

  const { warehouses, loading: warehousesLoading, error: warehousesError } =
    useWarehouses({ shopId })
  const {
    rows,
    loading: inventoryLoading,
    error: inventoryError,
  } = useInventoryRows(warehouses)
  const productNames = useProductNames()

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
