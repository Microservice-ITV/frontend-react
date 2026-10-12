import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { warehouseApi, warehouseErrorMessage } from '../api/warehouseApi'
import { WarehouseStatusBadge } from '../components/StockStatusBadge'
import { warehousePaths, type WarehouseAreaBase } from '../config/warehousePaths'
import { WAREHOUSE_STATUS_LABELS, type Warehouse } from '../types/warehouseTypes'

export type WarehouseDetailPageProps = {
  base: WarehouseAreaBase
}

const WarehouseDetailPage = ({ base }: WarehouseDetailPageProps) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const paths = warehousePaths(base)
  const { openModal } = useGlobalModal()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)

  useEffect(() => {
    if (!id) {
      setLoadError('Invalid warehouse id.')
      setLoading(false)
      return
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const response = await warehouseApi.getWarehouse(id)
        const data = response.data?.data ?? null
        if (!cancelled) {
          setWarehouse(data)
          if (!data) setLoadError('Warehouse not found.')
        }
      } catch (error) {
        if (!cancelled) setLoadError(warehouseErrorMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  const displayName = warehouse?.name?.trim() || 'Warehouse'

  const confirmDelete = () => {
    if (!id || !warehouse) return
    openModal({
      title: 'Delete warehouse?',
      content: (
        <p>
          Are you sure you want to delete <strong>{displayName}</strong>? This cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await warehouseApi.deleteWarehouse(id)
        navigate(paths.warehouses)
      },
    })
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to={paths.overview} className="hover:text-slate-700">
          Warehouse
        </Link>
        <span className="mx-1">/</span>
        <Link to={paths.warehouses} className="hover:text-slate-700">
          Warehouses
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{displayName}</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading warehouse details...
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">{loadError}</div>
      )}

      {!loading && !loadError && warehouse && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{displayName}</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(paths.warehouseEdit(warehouse.id))}
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
            <h2 className="text-base font-bold text-slate-900">Warehouse details</h2>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-medium text-slate-500">Name</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{warehouse.name}</p>
              </div>
              <div className="h-px bg-slate-200" />
              <div>
                <p className="text-xs font-medium text-slate-500">Code</p>
                <p className="mt-1 font-mono text-sm text-slate-900">{warehouse.code || '—'}</p>
              </div>
              <div className="h-px bg-slate-200" />
              <div>
                <p className="text-xs font-medium text-slate-500">Address</p>
                <p className="mt-1 text-sm text-slate-900">{warehouse.address?.trim() || '—'}</p>
              </div>
              <div className="h-px bg-slate-200" />
              <div>
                <p className="text-xs font-medium text-slate-500">Status</p>
                <div className="mt-1">
                  <WarehouseStatusBadge status={warehouse.status} />
                  <span className="sr-only">{WAREHOUSE_STATUS_LABELS[warehouse.status]}</span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default WarehouseDetailPage
