import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { usePageTitle } from '@/components/routing/PageTitle'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { adminUsersApi } from '@/features/admin/api/adminUsersApi'
import { warehouseApi, warehouseErrorMessage } from '../api/warehouseApi'
import { WarehouseStatusBadge } from '../components/StockStatusBadge'
import { warehousePaths, type WarehouseAreaBase } from '../config/warehousePaths'
import {
  WAREHOUSE_STATUS_LABELS,
  warehouseCapacityLabel,
  type Warehouse,
} from '../types/warehouseTypes'

export type WarehouseDetailPageProps = {
  base: WarehouseAreaBase
}

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="grid min-w-0 grid-cols-[9.5rem_minmax(0,1fr)] items-start gap-x-3 border-b border-slate-100 py-2.5 last:border-b-0 sm:grid-cols-[10.5rem_minmax(0,1fr)]">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <div className="break-words text-sm font-semibold text-slate-900">{value}</div>
  </div>
)

const WarehouseDetailPage = ({ base }: WarehouseDetailPageProps) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const paths = warehousePaths(base)
  const { openModal } = useGlobalModal()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [managerName, setManagerName] = useState<string | null>(null)

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
        const [warehouseResponse, managersResponse] = await Promise.all([
          warehouseApi.getWarehouse(id),
          adminUsersApi.listWarehouseManagers().catch(() => null),
        ])
        const data = warehouseResponse.data?.data ?? null
        if (cancelled) return
        setWarehouse(data)
        if (!data) {
          setLoadError('Warehouse not found.')
          setManagerName(null)
          return
        }
        const managers = managersResponse?.data?.data?.users ?? []
        const match = data.createdBy
          ? managers.find((user) => user.id === data.createdBy)
          : undefined
        setManagerName(match?.name?.trim() || match?.email || null)
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
  usePageTitle(warehouse?.name)

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

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-800">Warehouse details</h2>
            <div className="rounded-lg border border-slate-200 bg-white px-3 sm:px-4">
              <DetailRow label="Name" value={warehouse.name} />
              <DetailRow label="Code" value={warehouse.code || '—'} />
              <DetailRow label="Address" value={warehouse.address?.trim() || '—'} />
              <DetailRow label="Warehouse manager" value={managerName || '—'} />
              <DetailRow
                label="Capacity"
                value={
                  <span className={warehouse.isAtCapacity ? 'text-rose-700' : undefined}>
                    {warehouseCapacityLabel(warehouse)}
                  </span>
                }
              />
              <DetailRow
                label="Status"
                value={
                  <>
                    <WarehouseStatusBadge status={warehouse.status} />
                    <span className="sr-only">{WAREHOUSE_STATUS_LABELS[warehouse.status]}</span>
                  </>
                }
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default WarehouseDetailPage
