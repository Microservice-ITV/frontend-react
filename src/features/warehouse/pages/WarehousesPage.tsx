import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import WarehouseFormModal from '../components/WarehouseFormModal'
import ShopSelector from '../components/ShopSelector'
import { WarehouseStatusBadge } from '../components/StockStatusBadge'
import { primaryButtonClass, secondaryButtonClass } from '../components/forms/FormField'
import { warehousePaths, type WarehouseAreaBase } from '../config/warehousePaths'
import { useWarehouses } from '../hooks/useWarehouseData'
import {
  WAREHOUSE_STATUSES,
  type Warehouse,
  type WarehouseStatus,
} from '../types/warehouseTypes'

export type WarehousesPageProps = {
  base: WarehouseAreaBase
  platform?: boolean
}

const WarehousesPage = ({ base, platform = false }: WarehousesPageProps) => {
  const paths = warehousePaths(base)
  const [shopId, setShopId] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<WarehouseStatus | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Warehouse | null>(null)

  const { warehouses, loading, error, reload } = useWarehouses({ shopId })

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return warehouses.filter((warehouse) => {
      if (status && warehouse.status !== status) return false
      if (term) {
        const haystack = `${warehouse.name} ${warehouse.address ?? ''}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [warehouses, search, status])

  const columns: Array<DataTableColumn<Warehouse>> = [
    {
      key: 'name',
      header: 'Warehouse',
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="truncate text-xs text-slate-400" title={row.address ?? ''}>
            {row.address || 'No address'}
          </p>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      width: '140px',
      hideBelow: 'md',
      sortValue: (row) => row.code ?? '',
      render: (row) => (
        <span className="font-mono text-xs text-slate-500">{row.code ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      sortValue: (row) => row.status,
      render: (row) => <WarehouseStatusBadge status={row.status} />,
    },
    {
      key: 'id',
      header: 'ID',
      hideBelow: 'lg',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400" title={row.id}>
          {row.id.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '230px',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`${paths.inventory}?warehouseId=${row.id}`}
            className={secondaryButtonClass}
          >
            Inventory
          </Link>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => {
              setEditing(row)
              setModalOpen(true)
            }}
          >
            <Pencil size={14} />
            Edit
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.overview} className="hover:text-slate-700">
          Warehouse
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Warehouses</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Warehouses</h1>
          <p className="text-sm text-slate-500">
            Manage the locations your stock lives in.
          </p>
        </div>
        <div className="flex items-start gap-3">
          {platform && <ShopSelector value={shopId} onChange={setShopId} />}
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
          >
            <Plus size={16} />
            Add warehouse
          </button>
        </div>
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search name or address…',
        }}
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            allLabel: 'All statuses',
            onChange: (value) => setStatus(value as WarehouseStatus | ''),
            options: WAREHOUSE_STATUSES.map((option) => ({
              value: option,
              label: option === 'ACTIVE' ? 'Active' : 'Inactive',
            })),
          },
        ]}
      />

      <DataTable<Warehouse>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No warehouses found."
        itemLabel="warehouses"
        minWidth="860px"
        fixedLayout
      />

      <WarehouseFormModal
        open={modalOpen}
        warehouse={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => void reload()}
      />
    </div>
  )
}

export default WarehousesPage
