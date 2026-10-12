import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Boxes, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import { WarehouseStatusBadge } from '../components/StockStatusBadge'
import { primaryButtonClass } from '../components/forms/FormField'
import { warehouseApi } from '../api/warehouseApi'
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

const WarehousesPage = ({ base }: WarehousesPageProps) => {
  const paths = warehousePaths(base)
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<WarehouseStatus | ''>('')
  const { warehouses, loading, error, reload } = useWarehouses()

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

  const confirmDelete = (warehouse: Warehouse) => {
    openModal({
      title: 'Delete warehouse?',
      content: (
        <p>
          Are you sure you want to delete <strong>{warehouse.name}</strong>? This cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await warehouseApi.deleteWarehouse(warehouse.id)
        await reload()
      },
    })
  }

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
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) => (
        <RowActionMenu
          ariaLabel={`Actions for ${row.name}`}
          items={[
            {
              key: 'view',
              label: 'View',
              icon: <Eye size={16} className="shrink-0 text-slate-500" />,
              onClick: () => navigate(paths.warehouseDetail(row.id)),
            },
            {
              key: 'inventory',
              label: 'Inventory Data',
              icon: <Boxes size={16} className="shrink-0 text-slate-500" />,
              onClick: () => navigate(`${paths.inventory}?warehouseId=${row.id}`),
            },
            {
              key: 'edit',
              label: 'Edit',
              icon: <Pencil size={16} className="shrink-0 text-slate-500" />,
              onClick: () => navigate(paths.warehouseEdit(row.id)),
            },
            {
              key: 'delete',
              label: 'Delete',
              icon: <Trash2 size={16} className="shrink-0 text-slate-500" />,
              className:
                'flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer',
              onClick: () => confirmDelete(row),
            },
          ]}
        />
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
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => navigate(paths.warehouseNew)}
        >
          <Plus size={16} />
          Add warehouse
        </button>
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
    </div>
  )
}

export default WarehousesPage
