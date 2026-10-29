import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, Eye, Pencil, Warehouse } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import RowActionMenu from '@/components/ui/RowActionMenu'
import DetailRow from '../components/DetailRow'
import { StockStatusBadge } from '../components/StockStatusBadge'
import { primaryButtonClass } from '../components/forms/FormField'
import TransferStockForm from '../components/forms/TransferStockForm'
import type { WarehouseAreaBase } from '../config/warehousePaths'
import { warehousePaths } from '../config/warehousePaths'
import { filterInventoryRows, useInventoryRows, useWarehouses } from '../hooks/useWarehouseData'
import { formatUnitPrice, useVariantPricing } from '../hooks/useVariantPricing'
import { productLabel, useProductNames } from '../hooks/useProductNames'
import {
  AVAILABILITY_LABELS,
  type AvailabilityStatus,
  type InventoryRow,
  type StockOperationKind,
} from '../types/warehouseTypes'
import { variantDisplayLabel } from '../utils/variantLabel'

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
    subtitle: 'Request a transfer. A warehouse manager waits for the seller before the stock moves.',
    variant: 'drawer',
    size: 'lg',
  },
}

const InventoryPage = ({ base }: InventoryPageProps) => {
  const isSeller = base === '/seller'
  const canTransfer = isSeller || base === '/warehouse-manager'
  const canEditPrice = isSeller
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const paths = warehousePaths(base)

  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState(
    searchParams.get('warehouseId') ?? '',
  )
  const [availability, setAvailability] = useState<AvailabilityStatus | ''>('')
  const [operation, setOperation] = useState<StockOperationKind | null>(null)
  const [context, setContext] = useState<{
    warehouseId?: string
    productId?: string
    variantId?: string
  }>({})
  const [detailRow, setDetailRow] = useState<InventoryRow | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Notice handed over by the edit page after saving prices.
  useEffect(() => {
    const message = (location.state as { notice?: string } | null)?.notice
    if (!message) return
    setNotice(message)
    window.setTimeout(() => setNotice(null), 4000)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate])

  // Seller: warehouses they created + warehouses they received goods into.
  const { warehouses, loading: warehousesLoading, error: warehousesError } = useWarehouses(
    isSeller ? { status: 'ACTIVE', includePurchased: true } : undefined,
  )
  const warehouseInventory = useInventoryRows(warehouses)
  const productNames = useProductNames()
  const detailPricing = useVariantPricing(detailRow?.productId, detailRow?.variantId, {
    colorName: detailRow?.colorName,
    sizeName: detailRow?.sizeName,
  })

  const rows = warehouseInventory.rows
  const loading = warehouseInventory.loading
  const error = warehouseInventory.error
  const reload = () => {
    void warehouseInventory.reload()
  }

  const warehouseFilterOptions = useMemo(
    () =>
      warehouses.map((warehouse) => ({
        value: warehouse.id,
        label: warehouse.name,
      })),
    [warehouses],
  )

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

  const rowVariantLabel = (row: InventoryRow) =>
    variantDisplayLabel(row.variantId, {
      variantLabel: row.variantLabel,
      colorName: row.colorName,
      sizeName: row.sizeName,
    })

  const columns: Array<DataTableColumn<InventoryRow>> = [
    {
      key: 'product',
      header: 'Product',
      sortValue: (row) => productLabel(productNames, row.productId),
      render: (row) => (
        <button
          type="button"
          className="min-w-0 text-left"
          onClick={() => setDetailRow(row)}
        >
          <span
            className="block max-w-[280px] truncate text-sm font-medium text-slate-700 hover:text-[var(--dni-primary-600)]"
            title={row.productId}
          >
            {productLabel(productNames, row.productId)}
          </span>
        </button>
      ),
    },
    {
      key: 'variant',
      header: 'Variant',
      width: '160px',
      sortValue: (row) => rowVariantLabel(row),
      render: (row) => {
        const label = rowVariantLabel(row)
        return label ? (
          <span className="block max-w-[160px] truncate text-sm text-slate-700" title={label}>
            {label}
          </span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )
      },
    },
    {
      key: 'warehouse',
      header: 'Warehouse',
      width: '160px',
      sortValue: (row) => row.warehouseName,
      render: (row) => (
        <span className="block max-w-[160px] truncate text-sm text-slate-700" title={row.warehouseName}>
          {row.warehouseName}
        </span>
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
      key: 'actions',
      header: '',
      align: 'right' as const,
      width: '60px',
      render: (row: InventoryRow) => (
        <RowActionMenu
          ariaLabel={`Actions for ${productLabel(productNames, row.productId)}`}
          items={[
            {
              key: 'details',
              label: 'Details',
              icon: <Eye size={14} />,
              onClick: () => setDetailRow(row),
            },
            ...(canEditPrice
              ? [
                  {
                    key: 'edit',
                    label: 'Edit prices',
                    icon: <Pencil size={14} />,
                    onClick: () =>
                      navigate(
                        `${paths.inventoryEdit}?warehouseId=${encodeURIComponent(
                          row.warehouseId,
                        )}&stockId=${encodeURIComponent(row.id)}`,
                      ),
                  },
                ]
              : []),
            ...(canTransfer
              ? [
                  {
                    key: 'transfer',
                    label: 'Transfer',
                    icon: <ArrowLeftRight size={14} />,
                    onClick: () =>
                      openOperation('transfer', {
                        warehouseId: row.warehouseId,
                        productId: row.productId,
                        variantId: row.variantId || undefined,
                      }),
                  },
                ]
              : []),
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
            sellerMode={false}
            skipSellerApprovalHint={isSeller}
            defaultWarehouseId={context.warehouseId || warehouseFilter || undefined}
            defaultProductId={context.productId}
            defaultVariantId={context.variantId}
            onSuccess={() =>
              handleSuccess(
                isSeller
                  ? 'Transfer submitted as Approved. The warehouse manager can complete it.'
                  : 'Transfer request submitted. It waits for the seller to approve.',
              )
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
        <span className="text-slate-700">Inventory Data</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory Data</h1>
          <p className="text-sm text-slate-500">
            {isSeller
              ? 'All received products across warehouses you use. Transfer stock between warehouses when needed.'
              : 'On-hand stock across every warehouse, with live availability status.'}
          </p>
        </div>
        {canTransfer && (
          <div className="flex flex-wrap items-start gap-2">
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => openOperation('transfer', { warehouseId: warehouseFilter })}
            >
              <ArrowLeftRight size={14} />
              Transfer
            </button>
          </div>
        )}
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
            allLabel: isSeller ? 'All locations' : 'All warehouses',
            onChange: setWarehouseFilter,
            options: warehouseFilterOptions,
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
          minWidth="960px"
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
                minWidth="960px"
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
          subtitle={
            isSeller
              ? 'Move received stock between warehouses. The source warehouse manager completes it.'
              : meta.subtitle
          }
          variant={meta.variant}
          size={meta.size}
        >
          {operationBody()}
        </ModalDrawer>
      )}

      {detailRow && (
        <ModalDrawer
          open
          onClose={() => setDetailRow(null)}
          title="Inventory details"
          subtitle={productLabel(productNames, detailRow.productId)}
          variant="modal"
          size="sm"
          fitContent
        >
          <div>
            <DetailRow
              dense
              label="Product"
              value={productLabel(productNames, detailRow.productId)}
            />
            <DetailRow dense label="Warehouse" value={detailRow.warehouseName} />
            <DetailRow dense label="Variant" value={rowVariantLabel(detailRow)} />
            <DetailRow
              dense
              label="Unit price"
              value={formatUnitPrice(detailRow.unitPrice)}
            />
            <DetailRow
              dense
              label="Selling price"
              value={
                detailPricing.loading
                  ? 'Loading…'
                  : formatUnitPrice(detailPricing.sellingPrice)
              }
            />
            <DetailRow dense label="On hand" value={String(detailRow.onHandQty)} />
            <DetailRow dense label="Reserved" value={String(detailRow.reservedQty)} />
            <DetailRow
              dense
              label="Available"
              value={String(detailRow.availableQty)}
            />
            {detailRow.length != null && Number(detailRow.length) > 0 && (
              <DetailRow dense label="Length (cm)" value={String(detailRow.length)} />
            )}
            {detailRow.width != null && Number(detailRow.width) > 0 && (
              <DetailRow dense label="Width (cm)" value={String(detailRow.width)} />
            )}
            {detailRow.height != null && Number(detailRow.height) > 0 && (
              <DetailRow dense label="Height (cm)" value={String(detailRow.height)} />
            )}
            {detailRow.weightPerUnit != null &&
              Number(detailRow.weightPerUnit) > 0 && (
                <DetailRow
                  dense
                  label="Weight / unit"
                  value={String(detailRow.weightPerUnit)}
                />
              )}
            {detailRow.volumePerUnit != null &&
              Number(detailRow.volumePerUnit) > 0 && (
                <DetailRow
                  dense
                  label="Volume / unit"
                  value={String(detailRow.volumePerUnit)}
                />
              )}
            <DetailRow
              dense
              label="Status"
              value={<StockStatusBadge status={detailRow.availabilityStatus} />}
            />
          </div>

          {(canTransfer || canEditPrice) && (
            <div className="mt-3 flex items-center justify-end gap-2">
              {canEditPrice && (
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    navigate(
                      `${paths.inventoryEdit}?warehouseId=${encodeURIComponent(
                        detailRow.warehouseId,
                      )}&stockId=${encodeURIComponent(detailRow.id)}`,
                    )
                    setDetailRow(null)
                  }}
                >
                  <Pencil size={14} />
                  Edit prices
                </button>
              )}
              {canTransfer && (
                <button
                  type="button"
                  className={primaryButtonClass}
                  onClick={() => {
                    openOperation('transfer', {
                      warehouseId: detailRow.warehouseId,
                      productId: detailRow.productId,
                      variantId: detailRow.variantId || undefined,
                    })
                    setDetailRow(null)
                  }}
                >
                  <ArrowLeftRight size={14} />
                  Transfer
                </button>
              )}
            </div>
          )}
        </ModalDrawer>
      )}
    </div>
  )
}

export default InventoryPage
