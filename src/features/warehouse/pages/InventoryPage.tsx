import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, Warehouse } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import RowActionMenu from '@/components/ui/RowActionMenu'
import ShopSelector from '../components/ShopSelector'
import { StockStatusBadge } from '../components/StockStatusBadge'
import { primaryButtonClass } from '../components/forms/FormField'
import TransferStockForm from '../components/forms/TransferStockForm'
import type { WarehouseAreaBase } from '../config/warehousePaths'
import { filterInventoryRows, useInventoryRows, useWarehouses } from '../hooks/useWarehouseData'
import { productLabel, useProductNames } from '../hooks/useProductNames'
import {
  AVAILABILITY_LABELS,
  type AvailabilityStatus,
  type InventoryRow,
  type StockOperationKind,
} from '../types/warehouseTypes'

export type InventoryPageProps = {
  base: WarehouseAreaBase
  platform?: boolean
}

const OPERATION_META: Record<
  StockOperationKind,
  {
    title: string
    subtitle: string
    variant: 'modal' | 'drawer'
    size: 'md' | 'lg' | 'xl'
  }
> = {
  transfer: {
    title: 'Transfer Stock',
    subtitle: 'Request a transfer between warehouses — waits for approval.',
    variant: 'drawer',
    size: 'lg',
  },
}

const InventoryPage = ({ platform = false }: InventoryPageProps) => {
  const [searchParams] = useSearchParams()

  const [shopId, setShopId] = useState('')
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState(
    searchParams.get('warehouseId') ?? '',
  )
  const [availability, setAvailability] = useState<AvailabilityStatus | ''>('')
  const [operation, setOperation] = useState<StockOperationKind | null>(null)
  const [context, setContext] = useState<{ warehouseId?: string; productId?: string }>({})
  const [notice, setNotice] = useState<string | null>(null)

  const { warehouses, loading: warehousesLoading, error: warehousesError } =
    useWarehouses({ shopId })
  const { rows, loading, error, reload } = useInventoryRows(warehouses)
  const productNames = useProductNames()

  const visibleRows = useMemo(
    () =>
      filterInventoryRows(rows, {
        search,
        warehouseId: warehouseFilter,
        availability,
        productNames,
      }),
    [rows, search, warehouseFilter, availability, productNames],
  )

  /** Stock rows grouped by warehouse (warehouse_id), ordered by warehouse name. */
  const groups = useMemo(() => {
    const map = new Map<string, { warehouseId: string; warehouseName: string; rows: InventoryRow[] }>()
    for (const row of visibleRows) {
      const group = map.get(row.warehouseId)
      if (group) {
        group.rows.push(row)
      } else {
        map.set(row.warehouseId, {
          warehouseId: row.warehouseId,
          warehouseName: row.warehouseName,
          rows: [row],
        })
      }
    }
    return [...map.values()].sort((a, b) => a.warehouseName.localeCompare(b.warehouseName))
  }, [visibleRows])

  const openOperation = (kind: StockOperationKind, nextContext?: typeof context) => {
    setContext(nextContext ?? {})
    setOperation(kind)
  }

  const handleSuccess = (message: string) => {
    void reload()
    setNotice(message)
    setOperation(null)
    setContext({})
    window.setTimeout(() => setNotice(null), 4000)
  }

  const meta = operation ? OPERATION_META[operation] : null

  const columns: Array<DataTableColumn<InventoryRow>> = [
    {
      key: 'product',
      header: 'Product',
      sortValue: (row) => productLabel(productNames, row.productId),
      render: (row) => (
        <div className="min-w-0">
          <span
            className="block max-w-[320px] truncate text-sm font-medium text-slate-700"
            title={row.productId}
          >
            {productLabel(productNames, row.productId)}
          </span>
          {row.variantId && (
            <span className="text-xs text-slate-400">variant: {row.variantId}</span>
          )}
        </div>
      ),
    },
    {
      key: 'onHand',
      header: 'On hand',
      align: 'right',
      width: '100px',
      sortValue: (row) => row.onHandQty,
      render: (row) => <span className="font-medium text-slate-900">{row.onHandQty}</span>,
    },
    {
      key: 'reserved',
      header: 'Reserved',
      align: 'right',
      width: '100px',
      hideBelow: 'sm',
      sortValue: (row) => row.reservedQty,
      render: (row) => (
        <span className={row.reservedQty > 0 ? 'font-medium text-amber-600' : 'text-slate-400'}>
          {row.reservedQty}
        </span>
      ),
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
      key: 'updatedAt',
      header: 'Updated',
      hideBelow: 'lg',
      width: '150px',
      sortValue: (row) => row.updatedAt,
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) => (
        <RowActionMenu
          ariaLabel={`Actions for ${productLabel(productNames, row.productId)}`}
          items={[
            {
              key: 'transfer',
              label: 'Transfer',
              icon: <ArrowLeftRight size={14} />,
              onClick: () =>
                openOperation('transfer', {
                  warehouseId: row.warehouseId,
                  productId: row.productId,
                }),
            },
          ]}
        />
      ),
    },
  ]

  const operationBody = () => {
    if (!operation) return null
    switch (operation) {
      case 'transfer':
        return (
          <TransferStockForm
            warehouses={warehouses}
            defaultWarehouseId={context.warehouseId || warehouseFilter || undefined}
            defaultProductId={context.productId}
            onSuccess={() =>
              handleSuccess('Transfer request submitted — pending warehouse approval.')
            }
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <span>Dashboard</span> <span className="mx-1">/</span>
        <span>Warehouse</span> <span className="mx-1">/</span>
        <span className="text-slate-700">Inventory</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory</h1>
          <p className="text-sm text-slate-500">
            On-hand stock across every warehouse, with live availability status.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {platform && <ShopSelector value={shopId} onChange={setShopId} />}
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => openOperation('transfer', { warehouseId: warehouseFilter })}
          >
            <ArrowLeftRight size={14} />
            Transfer
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search product, variant or warehouse…',
        }}
        selects={[
          {
            key: 'warehouse',
            label: 'Warehouse',
            value: warehouseFilter,
            allLabel: 'All warehouses',
            onChange: setWarehouseFilter,
            options: warehouses.map((warehouse) => ({
              value: warehouse.id,
              label: warehouse.name,
            })),
          },
          {
            key: 'availability',
            label: 'Status',
            value: availability,
            allLabel: 'All statuses',
            onChange: (value) => setAvailability(value as AvailabilityStatus | ''),
            options: (Object.keys(AVAILABILITY_LABELS) as AvailabilityStatus[]).map(
              (value) => ({ value, label: AVAILABILITY_LABELS[value] }),
            ),
          },
        ]}
      />

      {groups.length === 0 ? (
        <DataTable<InventoryRow>
          columns={columns}
          rows={visibleRows}
          rowKey={(row) => row.id}
          loading={loading || warehousesLoading}
          error={warehousesError ?? error}
          emptyMessage="No inventory rows match these filters."
          itemLabel="stock rows"
          minWidth="860px"
          fixedLayout
        />
      ) : (
        groups.map((group) => {
          const totalOnHand = group.rows.reduce((sum, row) => sum + row.onHandQty, 0)
          const totalReserved = group.rows.reduce((sum, row) => sum + row.reservedQty, 0)
          const totalAvailable = group.rows.reduce((sum, row) => sum + row.availableQty, 0)
          return (
            <div key={group.warehouseId} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--dni-primary-soft)] text-[var(--dni-primary-600)]">
                    <Warehouse size={15} />
                  </span>
                  <h2 className="text-sm font-semibold text-slate-800">
                    {group.warehouseName}
                  </h2>
                  <span className="text-xs text-slate-400">warehouse_id: {group.warehouseId}</span>
                </div>
                <span className="text-xs text-slate-500">
                  {group.rows.length} products · on hand {totalOnHand} · reserved{' '}
                  {totalReserved} · available {totalAvailable}
                </span>
              </div>
              <DataTable<InventoryRow>
                columns={columns}
                rows={group.rows}
                rowKey={(row) => row.id}
                loading={loading || warehousesLoading}
                error={warehousesError ?? error}
                emptyMessage="No inventory rows match these filters."
                itemLabel="stock rows"
                initialRowsPerPage={10}
                minWidth="860px"
                fixedLayout
              />
            </div>
          )
        })
      )}

      {meta && operation && (
        <ModalDrawer
          open
          onClose={() => {
            setOperation(null)
            setContext({})
          }}
          title={meta.title}
          subtitle={meta.subtitle}
          variant={meta.variant}
          size={meta.size}
        >
          {operationBody()}
        </ModalDrawer>
      )}
    </div>
  )
}

export default InventoryPage
