import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, ScrollText } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar, { type FilterOption } from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import StatusBadge from '@/components/ui/StatusBadge'
import DetailRow from '../components/DetailRow'
import { warehouseApi, warehouseErrorMessage } from '../api/warehouseApi'
import type { WarehouseAreaBase } from '../config/warehousePaths'
import { useWarehouses } from '../hooks/useWarehouseData'
import { productLabel, useProductNames } from '../hooks/useProductNames'
import {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPES,
  type InventoryMovement,
  type MovementType,
} from '../types/warehouseTypes'
import { variantDisplayLabel } from '../utils/variantLabel'

const actorLabel = (row: Pick<InventoryMovement, 'createdBy' | 'createdByName'>) =>
  row.createdByName?.trim() ||
  (row.createdBy ? `${row.createdBy.slice(0, 8)}…` : 'system')

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

const MovementsPage = ({ base }: MovementsPageProps) => {
  const [search, setSearch] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [movementType, setMovementType] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<InventoryMovement | null>(null)

  const { warehouses } = useWarehouses(
    base === '/seller' ? { catalog: true, status: 'ACTIVE' } : undefined,
  )
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
        } ${movement.referenceType ?? ''} ${movement.createdBy ?? ''} ${actorLabel(
          movement,
        )}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [movements, search, fromDate, toDate, productNames])

  const warehouseName = useCallback(
    (id: string) => warehouses.find((warehouse) => warehouse.id === id)?.name ?? id,
    [warehouses],
  )

  /** Pairs TRANSFER_OUT / TRANSFER_IN movements that share a referenceId (same list fallback). */
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
      const enrichedFrom =
        movement.fromWarehouseName?.trim() ||
        (movement.fromWarehouseId ? warehouseName(movement.fromWarehouseId) : '')
      const enrichedTo =
        movement.toWarehouseName?.trim() ||
        (movement.toWarehouseId ? warehouseName(movement.toWarehouseId) : '')

      if (movement.movementType === 'TRANSFER_OUT' || movement.movementType === 'TRANSFER_IN') {
        if (enrichedFrom || enrichedTo) {
          return {
            from: enrichedFrom || '—',
            to: enrichedTo || '—',
          }
        }
        const pair = movement.referenceId
          ? transferPairs.get(movement.referenceId)
          : undefined
        if (movement.movementType === 'TRANSFER_OUT') {
          return {
            from: warehouseName(movement.warehouseId),
            to: pair?.in ? warehouseName(pair.in.warehouseId) : '—',
          }
        }
        return {
          from: pair?.out ? warehouseName(pair.out.warehouseId) : '—',
          to: warehouseName(movement.warehouseId),
        }
      }
      if (movement.movementType === 'SALE_ISSUED') {
        return {
          from: enrichedFrom || warehouseName(movement.warehouseId),
          to: enrichedTo || '—',
        }
      }
      if (movement.movementType === 'PURCHASE_RECEIVED') {
        return {
          from: enrichedFrom || 'Supplier',
          to: enrichedTo || warehouseName(movement.warehouseId),
        }
      }
      if (movement.movementType === 'PURCHASE_RETURNED') {
        return {
          from: enrichedFrom || warehouseName(movement.warehouseId),
          to: enrichedTo || 'Supplier',
        }
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
          {variantDisplayLabel(row.variantId) && (
            <span className="text-xs text-slate-400">{variantDisplayLabel(row.variantId)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'fromWarehouse',
      header: 'From',
      hideBelow: 'md',
      width: '150px',
      sortValue: (row) => routing(row).from,
      render: (row) => (
        <span className="text-sm text-slate-600">{routing(row).from}</span>
      ),
    },
    {
      key: 'toWarehouse',
      header: 'To',
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
      sortValue: (row) => actorLabel(row),
      render: (row) => (
        <span
          className="block max-w-[140px] truncate text-xs text-slate-600"
          title={row.createdBy ?? 'system'}
        >
          {actorLabel(row)}
        </span>
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
      </div>

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
            <div className="rounded-lg border border-slate-200 bg-white px-3 sm:px-4">
              <DetailRow label="Date" value={new Date(selected.createdAt).toLocaleString()} />
              <DetailRow
                label="Quantity"
                value={`${selected.quantity > 0 ? '+' : ''}${selected.quantity}`}
              />
              <DetailRow label="From" value={routing(selected).from} />
              <DetailRow label="To" value={routing(selected).to} />
              <DetailRow
                label="Before → After"
                value={`${selected.beforeQty} → ${selected.afterQty}`}
              />
              <DetailRow
                label="Unit cost"
                value={selected.unitCost ? Number(selected.unitCost).toFixed(2) : '—'}
              />
              <DetailRow
                label="Reference"
                value={`${selected.referenceId ?? '—'}${
                  selected.referenceType ? ` (${selected.referenceType})` : ''
                }`}
              />
              <DetailRow label="Created by" value={actorLabel(selected)} />
              <DetailRow
                label="Product"
                value={
                  <>
                    {productLabel(productNames, selected.productId)}
                    {variantDisplayLabel(selected.variantId)
                      ? ` · ${variantDisplayLabel(selected.variantId)}`
                      : ''}
                  </>
                }
              />
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
          </div>
        </ModalDrawer>
      )}
    </div>
  )
}

export default MovementsPage
