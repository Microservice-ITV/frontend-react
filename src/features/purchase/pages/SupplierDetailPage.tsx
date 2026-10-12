import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { SupplierStatusBadge } from '../components/PurchaseBadges'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import type { Supplier } from '../types/purchaseTypes'

export type SupplierDetailPageProps = {
  base: PurchaseAreaBase
}

const SupplierDetailPage = ({ base }: SupplierDetailPageProps) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const paths = purchasePaths(base)
  const { openModal } = useGlobalModal()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [supplier, setSupplier] = useState<Supplier | null>(null)

  useEffect(() => {
    if (!id) {
      setLoadError('Invalid supplier id.')
      setLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const response = await purchaseApi.getSupplier(id)
        const data = response.data?.data ?? null
        if (!cancelled) {
          setSupplier(data)
          if (!data) setLoadError('Supplier not found.')
        }
      } catch (error) {
        if (!cancelled) setLoadError(purchaseErrorMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  const displayName = supplier?.name?.trim() || 'Supplier'

  const confirmDelete = () => {
    if (!id || !supplier) return
    openModal({
      title: 'Delete supplier?',
      content: (
        <p>
          Are you sure you want to delete <strong>{displayName}</strong>? This cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await purchaseApi.deleteSupplier(id)
        navigate(paths.suppliers)
      },
    })
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">
          Warehouse
        </Link>
        <span className="mx-1">/</span>
        <Link to={paths.suppliers} className="hover:text-slate-700">
          Suppliers
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{displayName}</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading supplier details...
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">{loadError}</div>
      )}

      {!loading && !loadError && supplier && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{displayName}</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(paths.supplierEdit(supplier.id))}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={16} />
                Edit
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Supplier details</h2>
            <div className="mt-5 space-y-5">
              <Detail label="Name" value={supplier.name} />
              <Detail label="Code" value={supplier.code || '—'} mono />
              <Detail label="Status" value={<SupplierStatusBadge status={supplier.status} />} />
              <Detail label="Contact" value={supplier.contactName || '—'} />
              <Detail label="Email" value={supplier.email || '—'} />
              <Detail label="Phone" value={supplier.phone || '—'} />
              <Detail label="Address" value={supplier.address?.trim() || '—'} />
              <Detail label="Payment terms" value={supplier.paymentTerms || '—'} />
              <Detail label="Tax number" value={supplier.taxNumber || '—'} />
              <Detail label="Member since" value={new Date(supplier.createdAt).toLocaleDateString()} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}

const Detail = ({
  label,
  value,
  mono = false,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) => (
  <>
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className={`mt-1 text-sm text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
    <div className="h-px bg-slate-200 last:hidden" />
  </>
)

export default SupplierDetailPage
