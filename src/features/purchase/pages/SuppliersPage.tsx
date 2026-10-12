import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Plus } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import { SupplierStatusBadge } from '../components/PurchaseBadges'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import { useSuppliers } from '../hooks/usePurchaseData'
import type { Supplier, SupplierStatus } from '../types/purchaseTypes'

const primaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50'
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-50'
const subtleButtonClass =
  'text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-40'
const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--dni-primary)]'
const labelClass = 'mb-1 block text-xs font-medium text-slate-600'

type FormState = {
  name: string
  code: string
  contactName: string
  email: string
  phone: string
  address: string
  paymentTerms: string
  taxNumber: string
  status: SupplierStatus
}

const emptyForm: FormState = {
  name: '',
  code: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
  paymentTerms: '',
  taxNumber: '',
  status: 'ACTIVE',
}

export type SuppliersPageProps = {
  base: PurchaseAreaBase
  platform?: boolean
}

const SuppliersPage = ({ base }: SuppliersPageProps) => {
  const paths = purchasePaths(base)
  const [status, setStatus] = useState<SupplierStatus | ''>('')
  const [search, setSearch] = useState('')
  const { suppliers, loading, error, reload } = useSuppliers({ status })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Supplier | null>(null)

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

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier)
    setForm({
      name: supplier.name,
      code: supplier.code ?? '',
      contactName: supplier.contactName ?? '',
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      address: supplier.address ?? '',
      paymentTerms: supplier.paymentTerms ?? '',
      taxNumber: supplier.taxNumber ?? '',
      status: supplier.status,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        name: form.name,
        code: form.code || null,
        contactName: form.contactName || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        paymentTerms: form.paymentTerms || null,
        taxNumber: form.taxNumber || null,
        status: form.status,
      }
      if (editing) {
        await purchaseApi.updateSupplier(editing.id, payload)
      } else {
        await purchaseApi.createSupplier(payload)
      }
      setModalOpen(false)
      await reload()
    } catch (err) {
      setFormError(purchaseErrorMessage(err))
    } finally {
      setSaving(false)
    }
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
      key: 'contact',
      header: 'Contact',
      hideBelow: 'lg',
      render: (row) => (
        <span className="text-sm text-slate-600">{row.contactName || row.phone || '—'}</span>
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
      width: '240px',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className={subtleButtonClass}
            onClick={() => setProfile(row)}
          >
            <span className="inline-flex items-center gap-1">
              <Eye size={13} />
              Profile
            </span>
          </button>
          <Link
            to={`${paths.newOrder}?supplier_id=${row.id}&source_route=supplier`}
            className={secondaryButtonClass}
          >
            New PO
          </Link>
          <button type="button" className={secondaryButtonClass} onClick={() => openEdit(row)}>
            Edit
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={purchasePaths(base).root} className="hover:text-slate-700">
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
        <button type="button" className={primaryButtonClass} onClick={openCreate}>
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

      <ModalDrawer
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit supplier' : 'New supplier'}
      >
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Name</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Code</label>
              <input
                className={inputClass}
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as SupplierStatus })
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Contact name</label>
              <input
                className={inputClass}
                value={form.contactName}
                onChange={(event) => setForm({ ...form, contactName: event.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              className={inputClass}
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input
              className={inputClass}
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Payment terms</label>
            <input
              className={inputClass}
              value={form.paymentTerms}
              placeholder="e.g. Net 30"
              onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Tax number</label>
            <input
              className={inputClass}
              value={form.taxNumber}
              placeholder="e.g. VAT/TIN registration number"
              onChange={(event) => setForm({ ...form, taxNumber: event.target.value })}
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </ModalDrawer>

      {profile && (
        <ModalDrawer
          open
          onClose={() => setProfile(null)}
          title={profile.name}
          subtitle={profile.code ? `Code: ${profile.code}` : undefined}
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <DetailCell label="Status" value={<SupplierStatusBadge status={profile.status} size="md" />} />
              <DetailCell label="Contact" value={profile.contactName || '—'} />
              <DetailCell label="Email" value={profile.email || '—'} />
              <DetailCell label="Phone" value={profile.phone || '—'} />
              <DetailCell label="Payment terms" value={profile.paymentTerms || '—'} />
              <DetailCell label="Tax number" value={profile.taxNumber || '—'} />
              <DetailCell label="Member since" value={new Date(profile.createdAt).toLocaleDateString()} />
            </div>
            <DetailCell label="Address" value={profile.address || '—'} />
            <div className="flex justify-end gap-2">
              <Link
                to={`${paths.newOrder}?supplier_id=${profile.id}&source_route=supplier_profile`}
                className={primaryButtonClass}
              >
                Create purchase order
              </Link>
            </div>
          </div>
        </ModalDrawer>
      )}
    </div>
  )
}

const DetailCell = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className="text-sm text-slate-700">{value}</p>
  </div>
)

export default SuppliersPage