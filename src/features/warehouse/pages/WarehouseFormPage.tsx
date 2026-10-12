import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { warehouseApi, warehouseErrorMessage } from '../api/warehouseApi'
import { warehousePaths, type WarehouseAreaBase } from '../config/warehousePaths'
import { WAREHOUSE_STATUSES, type WarehouseStatus } from '../types/warehouseTypes'

export type WarehouseFormPageProps = {
  base: WarehouseAreaBase
  mode: 'create' | 'edit'
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
const labelClass = 'block text-xs font-medium text-slate-600'
const sectionClass = 'rounded-xl border border-slate-200 bg-white p-5 sm:p-6'

const WarehouseFormPage = ({ base, mode }: WarehouseFormPageProps) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const paths = warehousePaths(base)
  const [loading, setLoading] = useState(mode === 'edit')
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<WarehouseStatus>('ACTIVE')

  useEffect(() => {
    if (mode !== 'edit' || !id) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const response = await warehouseApi.getWarehouse(id)
        const warehouse = response.data?.data
        if (!warehouse) {
          if (!cancelled) setLoadError('Warehouse not found.')
          return
        }
        if (cancelled) return
        setName(warehouse.name)
        setCode(warehouse.code ?? '')
        setAddress(warehouse.address ?? '')
        setStatus(warehouse.status)
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
  }, [mode, id])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      setSubmitError('Name must be at least 2 characters.')
      return
    }
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const payload = {
        name: trimmedName,
        code: code.trim().toUpperCase() || null,
        address: address.trim() || null,
        status,
      }
      if (mode === 'edit' && id) {
        await warehouseApi.updateWarehouse(id, payload)
        navigate(paths.warehouseDetail(id))
      } else {
        await warehouseApi.createWarehouse(payload)
        navigate(paths.warehouses)
      }
    } catch (error) {
      setSubmitError(warehouseErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = mode === 'create' ? 'New warehouse' : 'Edit warehouse'

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
        <span className="text-slate-900">{title}</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading warehouse...
        </div>
      )}

      {!loading && loadError && (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{loadError}</p>
          <Link
            to={paths.warehouses}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Back to list
          </Link>
        </div>
      )}

      {!loading && !loadError && (
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{title}</h1>
              <p className="mt-0.5 text-sm text-slate-600">
                Name, code, address, and whether this warehouse can hold stock.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(paths.warehouses)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create warehouse' : 'Save changes'}
              </button>
            </div>
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {submitError}
            </p>
          )}

          <section className={sectionClass}>
            <h2 className="text-sm font-semibold text-slate-900">Warehouse details</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="warehouse-name" className={labelClass}>
                  Name
                </label>
                <input
                  id="warehouse-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  placeholder="Central Warehouse"
                  required
                />
              </div>
              <div>
                <label htmlFor="warehouse-code" className={labelClass}>
                  Code
                </label>
                <input
                  id="warehouse-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className={inputClass}
                  placeholder="WH-CENTRAL"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="warehouse-address" className={labelClass}>
                  Address
                </label>
                <input
                  id="warehouse-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className={inputClass}
                  placeholder="12th Street, Industrial Area"
                />
              </div>
              <div>
                <label htmlFor="warehouse-status" className={labelClass}>
                  Status
                </label>
                <select
                  id="warehouse-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as WarehouseStatus)}
                  className={inputClass}
                >
                  {WAREHOUSE_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {option === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </form>
      )}
    </div>
  )
}

export default WarehouseFormPage
