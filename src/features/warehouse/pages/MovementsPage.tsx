import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, ScrollText, X } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar, { type FilterOption } from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import StatusBadge from '@/components/ui/StatusBadge'
import ShopSelector from '../components/ShopSelector'
import { warehouseApi, warehouseErrorMessage } from '../api/warehouseApi'
import type { WarehouseAreaBase } from '../config/warehousePaths'
import { useWarehouses } from '../hooks/useWarehouseData'
import { productLabel, useProductNames } from '../hooks/useProductNames'
import {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPES,
  type InventoryMovement,
  type MovementType,
  type WarehouseTransfer,
} from '../types/warehouseTypes'

export type MovementsPageProps = {
  base: WarehouseAreaBase
  platform?: boolean
}

const movementTone = (movementType: MovementType) => {
  if (movementType === 'TRANSFER_IN' || movementType === 'PURCHASE_RECEIVED') {
    return 'success' as const
  }
  if (movementType === 'TRANSFER_OUT' || movementType === 'SALE_ISSUED') {
    return 'danger' as const
  }
  return 'neutral' as const
}

const MOVEMENT_TYPE_OPTIONS: FilterOption[] = MOVEMENT_TYPES.map((type) => ({
  value: type,
  label: MOVEMENT_TYPE_LABELS[type],
}))

const MovementsPage = ({ platform = false }: MovementsPageProps) => {
  const [shopId, setShopId] = useState('')
  const [search, setSearch] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [movementType, setMovementType] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<InventoryMovement | null>(null)
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>([])
  const [transfersLoading, setTransfersLoading] = useState(true)
  const [transfersError, setTransfersError] = useState<string | null>(null)
  const [decidingId, setDecidingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(
    null,
  )

  const { warehouses } = useWarehouses({ shopId })
  const productNames = useProductNames()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await warehouseApi.listMovements({
        limit: 500,
        ...(warehouseId ? { warehouseId } : {}),
        ...(movementType ? { movementType } : {}),
      })
      setMovements(response.data?.data ?? [])
    } catch (err) {
      setMovements([])
      setError(warehouseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [warehouseId, movementType])

  useEffect(() => {
    void load()
  }, [load])

  const loadTransfers = useCallback(async () => {
    setTransfersLoading(true)
    setTransfersError(null)
    try {
      const response = await warehouseApi.listTransfers({ status: 'PENDING', limit: 100 })
      setTransfers(response.data?.data ?? [])
    } catch (err) {
      setTransfers([])
      setTransfersError(warehouseErrorMessage(err))
    } finally {
      setTransfersLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTransfers()
  }, [loadTransfers])

  const decideTransfer = async (
    transfer: WarehouseTransfer,
    action: 'approve' | 'reject',
  ) => {
    const label = transfer.referenceId ?? transfer.id.slice(0, 8)
    setDecidingId(transfer.id)
    setFeedback(null)
    try {
      if (action === 'approve') {
        await warehouseApi.approveTransfer(transfer.id)
        setFeedback({ tone: 'success', message: `Transfer ${label} approved — stock moved.` })
      } else {
        await warehouseApi.rejectTransfer(transfer.id, 'Rejected from inventory movements')
        setFeedback({ tone: 'success', message: `Transfer ${label} rejected.` })
      }
      await Promise.all([load(), loadTransfers()])
    } catch (err) {
      setFeedback({ tone: 'danger', message: warehouseErrorMessage(err) })
    } finally {
      setDecidingId(null)
    }
  }

  const transferColumns: Array<DataTableColumn<WarehouseTransfer>> = [
    {
      key: 'reference',
      header: 'Reference',
      width: '170px',
      render: (row) => (
        <span className="text-xs text-slate-700">{row.referenceId ?? row.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
          {warehouseName(row.fromWarehouseId)}
          <ArrowRight size={13} className="text-slate-400" />
          {warehouseName(row.toWarehouseId)}
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <span
          className="block max-w-[220px] truncate text-sm text-slate-700"
          title={row.productId}
        >
          {productLabel(productNames, row.productId)}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'right',
      width: '80px',
      render: (row) => <span className="font-medium text-slate-900">{row.quantity}</span>,
    },
    {
      key: 'requested',
      header: 'Requested',
      width: '170px',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '190px',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => void decideTransfer(row, 'approve')}
            disabled={decidingId === row.id}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check size={13} />
            Approve
          </button>
          <button
            type="button"
            onClick={() => void decideTransfer(row, 'reject')}
            disabled={decidingId === row.id}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={13} />
            Reject
          </button>
        </div>
      ),
    },
  ]

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return movements.filter((movement) => {
      if (fromDate && new Date(movement.createdAt) < new Date(fromDate)) return false
      if (toDate) {
        const end = new Date(toDate)
        end.setHours(23, 59, 59, 999)
        if (new Date(movement.createdAt) > end) return false
      }
      if (term) {
        const haystack = `${movement.productId} ${
          productNames[movement.productId] ?? ''
        } ${movement.variantId} ${
          movement.referenceId ?? ''
        } ${movement.referenceType ?? ''} ${movement.createdBy ?? ''}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [movements, search, fromDate, toDate, productNames])

  const warehouseName = useCallback(
    (id: string) => warehouses.find((warehouse) => warehouse.id === id)?.name ?? id,
    [warehouses],
  )

  /** Pairs TRANSFER_OUT / TRANSFER_IN movements that share a referenceId. */
  const transferPairs = useMemo(() => {
    const map = new Map<string, { out?: InventoryMovement; in?: InventoryMovement }>()
    for (const movement of movements) {
      if (!movement.referenceId) continue
      if (movement.movementType !== 'TRANSFER_OUT' && movement.movementType !== 'TRANSFER_IN') {
        continue
      }
      const entry = map.get(movement.referenceId) ?? {}
      if (movement.movementType === 'TRANSFER_OUT') entry.out = movement
      else entry.in = movement
      map.set(movement.referenceId, entry)
    }
    return map
  }, [movements])

  /** Warehouse routing for a movement: where stock left and where it landed. */
  const routing = useCallback(
    (movement: InventoryMovement): { from: string; to: string } => {
      const pair = movement.referenceId
        ? transferPairs.get(movement.referenceId)
        : undefined
      if (movement.movementType === 'TRANSFER_OUT') {
        return {
          from: warehouseName(movement.warehouseId),
          to: pair?.in ? warehouseName(pair.in.warehouseId) : '—',
        }
      }
      if (movement.movementType === 'TRANSFER_IN') {
        return {
          from: pair?.out ? warehouseName(pair.out.warehouseId) : '—',
          to: warehouseName(movement.warehouseId),
        }
      }
      if (movement.movementType === 'SALE_ISSUED') {
        return { from: warehouseName(movement.warehouseId), to: '—' }
      }
      return { from: '—', to: warehouseName(movement.warehouseId) }
    },
    [warehouseName, transferPairs],
  )

  const columns: Array<DataTableColumn<InventoryMovement>> = [
    {
      key: 'createdAt',
      header: 'Date',
      width: '165px',
      sortValue: (row) => row.createdAt,
      render: (row) => (
        <span className="text-xs text-slate-600">
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
      key: 'product',
      header: 'Product',
      sortValue: (row) => productLabel(productNames, row.productId),
      render: (row) => (
        <div className="min-w-0">
          <span
            className="block max-w-[220px] truncate text-sm font-medium text-slate-700"
            title={row.productId}
          >
            {productLabel(productNames, row.productId)}
          </span>
          {row.variantId && (
            <span className="text-xs text-slate-400">{row.variantId}</span>
          )}
        </div>
      ),
    },
    {
      key: 'fromWarehouse',
      header: 'From warehouse',
      hideBelow: 'md',
      width: '150px',
      sortValue: (row) => routing(row).from,
      render: (row) => (
        <span className="text-sm text-slate-600">{routing(row).from}</span>
      ),
    },
    {
      key: 'toWarehouse',
      header: 'To warehouse',
      hideBelow: 'md',
      width: '150px',
      sortValue: (row) => routing(row).to,
      render: (row) => (
        <span className="flex items-center gap-1.5 text-sm text-slate-600">
          <ArrowRight
            size={13}
            className={
              routing(row).to === '—' ? 'text-slate-300' : 'text-emerald-600'
            }
          />
          {routing(row).to}
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
      width: '130px',
      hideBelow: 'lg',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.beforeQty} → {row.afterQty}
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Reference',
      hideBelow: 'lg',
      render: (row) => (
        <div className="min-w-0">
          <span className="block truncate text-xs text-slate-700">
            {row.referenceId ?? '—'}
          </span>
          <span className="text-xs text-slate-400">
            {row.referenceType ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'unitCost',
      header: 'Unit cost',
      align: 'right',
      width: '100px',
      hideBelow: 'xl',
      sortValue: (row) => Number(row.unitCost ?? 0),
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.unitCost ? Number(row.unitCost).toFixed(2) : '—'}
        </span>
      ),
    },
    {
      key: 'createdBy',
      header: 'By',
      hideBelow: 'xl',
      render: (row) => (
        <span className="text-xs text-slate-500">{row.createdBy ?? 'system'}</span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <span>Dashboard</span> <span className="mx-1">/</span>
        <span>Warehouse</span> <span className="mx-1">/</span>
        <span className="text-slate-700">Inventory Movements</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory Movements</h1>
          <p className="text-sm text-slate-500">
            Every receive and transfer between warehouses — newest first. Select a row for
            full routing details.
          </p>
        </div>
        {platform && <ShopSelector value={shopId} onChange={setShopId} />}
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">Pending transfer approvals</h2>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            {transfers.length} pending
          </span>
        </div>

        {feedback && (
          <div
            className={
              feedback.tone === 'success'
                ? 'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'
                : 'rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700'
            }
          >
            {feedback.message}
          </div>
        )}

        <DataTable<WarehouseTransfer>
          columns={transferColumns}
          rows={transfers}
          rowKey={(row) => row.id}
          loading={transfersLoading}
          error={transfersError}
          emptyMessage="No transfers waiting for approval."
          emptyIcon={Check}
          initialRowsPerPage={5}
          itemLabel="transfers"
          minWidth="860px"
          fixedLayout
        />
      </section>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search product, reference or user…',
        }}
        selects={[
          {
            key: 'warehouse',
            label: 'Warehouse',
            value: warehouseId,
            allLabel: 'All warehouses',
            onChange: setWarehouseId,
            options: warehouses.map((warehouse) => ({
              value: warehouse.id,
              label: warehouse.name,
            })),
          },
          {
            key: 'movementType',
            label: 'Movement type',
            value: movementType,
            allLabel: 'All types',
            onChange: setMovementType,
            options: MOVEMENT_TYPE_OPTIONS,
          },
        ]}
        dateRange={{
          from: fromDate,
          to: toDate,
          onFromChange: setFromDate,
          onToChange: setToDate,
        }}
      />

      <DataTable<InventoryMovement>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No movements match these filters."
        emptyIcon={ScrollText}
        initialRowsPerPage={10}
        itemLabel="movements"
        minWidth="900px"
        onRowClick={(row) => setSelected(row)}
      />

      {selected && (
        <ModalDrawer
          open
          onClose={() => setSelected(null)}
          title="Movement details"
          subtitle={MOVEMENT_TYPE_LABELS[selected.movementType]}
          variant="modal"
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <DetailCell label="Date" value={new Date(selected.createdAt).toLocaleString()} />
              <DetailCell
                label="Quantity"
                value={`${selected.quantity > 0 ? '+' : ''}${selected.quantity}`}
              />
              <DetailCell
                label="From warehouse"
                value={routing(selected).from}
                highlight={routing(selected).from !== '—'}
              />
              <DetailCell
                label="To warehouse"
                value={routing(selected).to}
                highlight={routing(selected).to !== '—'}
              />
              <DetailCell
                label="Before → After"
                value={`${selected.beforeQty} → ${selected.afterQty}`}
              />
              <DetailCell
                label="Unit cost"
                value={selected.unitCost ? Number(selected.unitCost).toFixed(2) : '—'}
              />
              <DetailCell
                label="Reference"
                value={`${selected.referenceId ?? '—'}${
                  selected.referenceType ? ` (${selected.referenceType})` : ''
                }`}
              />
              <DetailCell label="Created by" value={selected.createdBy ?? 'system'} />
            </div>

            {selected.movementType.startsWith('TRANSFER') && selected.referenceId && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Paired transfer legs share reference{' '}
                <span className="font-semibold">{selected.referenceId}</span> — the{' '}
                <span className="font-semibold">Transfer Out</span> and{' '}
                <span className="font-semibold">Transfer In</span> rows are two sides of the
                same move.
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Product: <span className="font-mono">{selected.productId}</span>
              {selected.variantId ? ` · variant: ${selected.variantId}` : ''}
            </div>
          </div>
        </ModalDrawer>
      )}
    </div>
  )
}

const DetailCell = ({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) => (
  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`text-sm ${highlight ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
      {value}
    </p>
  </div>
)

export default MovementsPage
