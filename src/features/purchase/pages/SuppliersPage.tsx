import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import { SupplierStatusBadge } from '../components/PurchaseBadges'
import { purchaseApi } from '../api/purchaseApi'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import { primaryButtonClass } from '../config/purchaseUiClasses'
import { useSuppliers } from '../hooks/usePurchaseData'
import type { Supplier, SupplierStatus } from '../types/purchaseTypes'

export type SuppliersPageProps = {
  base: PurchaseAreaBase
  platform?: boolean
}

const SuppliersPage = ({ base }: SuppliersPageProps) => {
  const paths = purchasePaths(base)
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const [status, setStatus] = useState<SupplierStatus | ''>('')
  const [search, setSearch] = useState('')
  const { suppliers, loading, error, reload } = useSuppliers({ status })

  const term = search.trim().toLowerCase()
  const rows = term
    ? suppliers.filter((supplier) =>
        `${supplier.name} ${supplier.code ?? ''} ${supplier.email ?? ''} ${
          supplier.contactName ?? ''
        }`
          .toLowerCase()
          .includes(term),
      )
    : suppliers

  const confirmDelete = (supplier: Supplier) => {
    openModal({
      title: 'Delete supplier?',
      content: (
        <p>
          Are you sure you want to delete <strong>{supplier.name}</strong>? This cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await purchaseApi.deleteSupplier(supplier.id)
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<Supplier>> = [
    {
      key: 'name',
      header: 'Supplier',
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="truncate text-xs text-slate-400">{row.code || row.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      hideBelow: 'lg',
      sortValue: (row) => row.email ?? '',
      render: (row) => (
        <span className="text-sm text-slate-600">{row.email || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      sortValue: (row) => row.status,
      render: (row) => <SupplierStatusBadge status={row.status} />,
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
              onClick: () => navigate(paths.supplierDetail(row.id)),
            },
            {
              key: 'edit',
              label: 'Edit',
              icon: <Pencil size={16} className="shrink-0 text-slate-500" />,
              onClick: () => navigate(paths.supplierEdit(row.id)),
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
        <Link to={paths.root} className="hover:text-slate-700">
          Warehouse
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Suppliers</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-sm text-slate-500">Vendors you place purchase orders with.</p>
        </div>
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => navigate(paths.supplierNew)}
        >
          <Plus size={16} />
          Add supplier
        </button>
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Search name, code or email…' }}
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            allLabel: 'All statuses',
            onChange: (value) => setStatus(value as SupplierStatus | ''),
            options: [
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ],
          },
        ]}
      />

      <DataTable<Supplier>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No suppliers found."
        itemLabel="suppliers"
        minWidth="860px"
        fixedLayout
      />
    </div>
  )
}

export default SuppliersPage
