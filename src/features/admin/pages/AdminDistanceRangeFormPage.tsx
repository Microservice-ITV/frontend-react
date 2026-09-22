import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  adminShippingApi,
  type AdminDistanceRangeDto,
  type PricingRuleSummaryDto,
} from '../api/adminShippingApi'

type DistanceRangeFormPageProps = {
  mode: 'create' | 'edit'
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
const labelClass = 'block text-xs font-medium text-slate-600'
const sectionClass = 'rounded-xl border border-slate-200 bg-white p-5 sm:p-6'

const AdminDistanceRangeFormPage = ({ mode }: DistanceRangeFormPageProps) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(mode === 'edit')
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [rules, setRules] = useState<PricingRuleSummaryDto[]>([])
  const [pricingRuleId, setPricingRuleId] = useState('')
  const [minDistanceKm, setMinDistanceKm] = useState('0')
  const [maxDistanceKm, setMaxDistanceKm] = useState('')
  const [fee, setFee] = useState('0')
  const [currency, setCurrency] = useState('MMK')

  useEffect(() => {
    void adminShippingApi
      .listPricingRules({ pageSize: 100 })
      .then((res) => setRules(res.data.data.rules))
      .catch(() => setRules([]))
  }, [])

  useEffect(() => {
    if (mode !== 'edit' || !id) return

    let cancelled = false
    const run = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const res = await adminShippingApi.getDistanceRange(id)
        const range: AdminDistanceRangeDto | undefined = res.data?.data
        if (!range) {
          if (!cancelled) setLoadError('Distance range not found.')
          return
        }
        if (cancelled) return
        setPricingRuleId(range.pricingRuleId)
        setMinDistanceKm(String(range.minDistanceKm))
        setMaxDistanceKm(range.maxDistanceKm === null ? '' : String(range.maxDistanceKm))
        setFee(String(range.fee))
        setCurrency(range.pricingRule?.currency ?? 'MMK')
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(adminShippingApi.getApiErrorMessage(error, 'Failed to load distance range.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [mode, id])

  useEffect(() => {
    if (mode !== 'create') return
    const selected = rules.find((rule) => rule.id === pricingRuleId)
    if (selected?.currency) setCurrency(selected.currency)
  }, [mode, pricingRuleId, rules])

  const validate = (): string | null => {
    if (!pricingRuleId) return 'Pricing rule is required.'

    const min = Number(minDistanceKm)
    if (!Number.isFinite(min) || min < 0) return 'Minimum distance must be non-negative.'

    if (maxDistanceKm.trim() !== '') {
      const max = Number(maxDistanceKm)
      if (!Number.isFinite(max) || max <= min) {
        return 'Maximum distance must be greater than the minimum or left empty.'
      }
    }

    const parsedFee = Number(fee)
    if (!Number.isFinite(parsedFee) || parsedFee < 0) return 'Fee must be a non-negative number.'

    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitError('')

    const validationError = validate()
    if (validationError) {
      setSubmitError(validationError)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        minDistanceKm: Number(minDistanceKm),
        maxDistanceKm: maxDistanceKm.trim() === '' ? null : Number(maxDistanceKm),
        fee: Number(fee),
      }
      if (mode === 'edit') {
        if (!id) {
          setSubmitError('Invalid distance range id.')
          return
        }
        await adminShippingApi.updateDistanceRange(id, payload)
      } else {
        await adminShippingApi.createDistanceRange({ ...payload, pricingRuleId })
      }
      navigate('/super-admin/shipping/distance-ranges')
    } catch (error: unknown) {
      setSubmitError(adminShippingApi.getApiErrorMessage(error, 'Could not save distance range.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <Link to="/super-admin/shipping/distance-ranges" className="hover:text-slate-700">
          Distance Ranges
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">
          {mode === 'create' ? 'New range' : 'Edit range'}
        </span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading distance range...
        </div>
      )}

      {!loading && loadError && (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{loadError}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Retry
            </button>
            <Link
              to="/super-admin/shipping/distance-ranges"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Back to list
            </Link>
          </div>
        </div>
      )}

      {!loading && !loadError && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate('/super-admin/shipping/distance-ranges')}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back to distance ranges
              </button>
              <h1 className="text-xl font-bold text-slate-900">
                {mode === 'create' ? 'New distance range' : 'Edit distance range'}
              </h1>
              <p className="mt-0.5 text-sm text-slate-600">
                Ranges for a rule must be contiguous and non-overlapping. Leave the max empty for
                open-ended.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/super-admin/shipping/distance-ranges')}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create range' : 'Save changes'}
              </button>
            </div>
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {submitError}
            </p>
          )}

          <section className={sectionClass}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="distance-range-rule" className={labelClass}>
                  Pricing rule
                </label>
                <select
                  id="distance-range-rule"
                  value={pricingRuleId}
                  onChange={(e) => setPricingRuleId(e.target.value)}
                  className={inputClass}
                  disabled={mode === 'edit'}
                  required
                >
                  <option value="">Select a pricing rule</option>
                  {rules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name} (v{rule.version} · {rule.status})
                    </option>
                  ))}
                </select>
                {mode === 'edit' && (
                  <p className="mt-1 text-xs text-slate-400">
                    The pricing rule cannot be changed after creation.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="distance-range-min" className={labelClass}>
                  Min distance (km)
                </label>
                <input
                  id="distance-range-min"
                  type="number"
                  min={0}
                  step="any"
                  value={minDistanceKm}
                  onChange={(e) => setMinDistanceKm(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="distance-range-max" className={labelClass}>
                  Max distance (km)
                  <span className="ml-1 font-normal text-slate-400">(blank = ∞)</span>
                </label>
                <input
                  id="distance-range-max"
                  type="number"
                  min={0}
                  step="any"
                  value={maxDistanceKm}
                  onChange={(e) => setMaxDistanceKm(e.target.value)}
                  placeholder="∞"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="distance-range-fee" className={labelClass}>
                  Fee ({currency || 'MMK'})
                </label>
                <input
                  id="distance-range-fee"
                  type="number"
                  min={0}
                  step="any"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/super-admin/shipping/distance-ranges')}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create range' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default AdminDistanceRangeFormPage
