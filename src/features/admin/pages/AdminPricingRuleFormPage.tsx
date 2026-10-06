import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  adminShippingApi,
  type CreatePricingRulePayload,
  type DeliveryPricingRuleDto,
  type PricingRuleStatus,
  type UpdatePricingRulePayload,
  type WeightRoundingMethod,
} from '../api/adminShippingApi'

type PricingRuleFormPageProps = {
  mode: 'create' | 'edit'
}

const toDateInputValue = (iso: string | null): string => {
  if (!iso) return ''
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
}

const ROUNDING_OPTIONS: { value: WeightRoundingMethod; label: string }[] = [
  { value: 'ROUND_UP', label: 'Round up' },
  { value: 'ROUND_DOWN', label: 'Round down' },
  { value: 'ROUND_NEAREST', label: 'Round nearest' },
]

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
const labelClass = 'block text-xs font-medium text-slate-600'
const sectionClass = 'rounded-xl border border-slate-200 bg-white p-5 sm:p-6'
const sectionTitleClass = 'text-sm font-semibold text-slate-900'
const sectionHintClass = 'mt-0.5 text-xs text-slate-500'

const AdminPricingRuleFormPage = ({ mode }: PricingRuleFormPageProps) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(mode === 'edit')
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('MMK')
  const [status, setStatus] = useState<PricingRuleStatus>('ACTIVE')
  const [minimumFee, setMinimumFee] = useState('0')
  const [maximumFee, setMaximumFee] = useState('100000')
  const [effectiveFrom, setEffectiveFrom] = useState(toDateInputValue(new Date().toISOString()))
  const [effectiveUntil, setEffectiveUntil] = useState('')
  const [dimensionalDivisor, setDimensionalDivisor] = useState('5000')
  const [weightRoundingMethod, setWeightRoundingMethod] =
    useState<WeightRoundingMethod>('ROUND_UP')
  const [weightRoundingIncrement, setWeightRoundingIncrement] = useState('0.5')

  useEffect(() => {
    if (mode !== 'edit' || !id) return

    let cancelled = false
    const run = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const res = await adminShippingApi.getPricingRule(id)
        const rule: DeliveryPricingRuleDto | undefined = res.data?.data
        if (!rule) {
          if (!cancelled) setLoadError('Pricing rule not found.')
          return
        }
        if (cancelled) return
        setName(rule.name)
        setCurrency(rule.currency)
        setStatus(rule.status)
        setMinimumFee(String(rule.minimumFee))
        setMaximumFee(String(rule.maximumFee))
        setEffectiveFrom(toDateInputValue(rule.effectiveFrom))
        setEffectiveUntil(toDateInputValue(rule.effectiveUntil))
        setDimensionalDivisor(String(rule.dimensionalDivisor))
        setWeightRoundingMethod(rule.weightRoundingMethod)
        setWeightRoundingIncrement(String(rule.weightRoundingIncrement))
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(adminShippingApi.getApiErrorMessage(error, 'Failed to load pricing rule.'))
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

  const validate = (): string | null => {
    if (!name.trim()) return 'Name is required.'
    const currencyCode = currency.trim().toUpperCase()
    if (currencyCode.length !== 3) return 'Currency must be a 3-letter code (e.g. MMK).'

    const minFee = Number(minimumFee)
    const maxFee = Number(maximumFee)
    if (!Number.isFinite(minFee) || minFee < 0) return 'Minimum fee must be a non-negative number.'
    if (!Number.isFinite(maxFee) || maxFee < 0) return 'Maximum fee must be a non-negative number.'
    if (maxFee < minFee) return 'Maximum fee must be greater than or equal to minimum fee.'

    if (!effectiveFrom) return 'Effective from date is required.'
    if (effectiveUntil && new Date(effectiveUntil) <= new Date(effectiveFrom)) {
      return 'Effective until must be after effective from.'
    }

    const divisor = Number(dimensionalDivisor)
    if (!Number.isFinite(divisor) || divisor <= 0) return 'Dimensional divisor must be positive.'

    const increment = Number(weightRoundingIncrement)
    if (!Number.isFinite(increment) || increment <= 0) {
      return 'Weight rounding increment must be positive.'
    }

    return null
  }

  const buildPayload = (): CreatePricingRulePayload => ({
    name: name.trim(),
    serviceType: 'STANDARD',
    dimensionalDivisor: Number(dimensionalDivisor),
    weightRoundingMethod,
    weightRoundingIncrement: Number(weightRoundingIncrement),
    currency: currency.trim().toUpperCase(),
    minimumFee: Number(minimumFee),
    maximumFee: Number(maximumFee),
    effectiveFrom: new Date(`${effectiveFrom}T00:00:00.000Z`).toISOString(),
    effectiveUntil: effectiveUntil
      ? new Date(`${effectiveUntil}T00:00:00.000Z`).toISOString()
      : null,
    status,
  })

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
      const payload = buildPayload()
      if (mode === 'edit') {
        if (!id) {
          setSubmitError('Invalid pricing rule id.')
          return
        }
        const updatePayload: UpdatePricingRulePayload = { ...payload }
        delete updatePayload.serviceType
        await adminShippingApi.updatePricingRule(id, updatePayload)
      } else {
        await adminShippingApi.createPricingRule(payload)
      }
      navigate('/super-admin/shipping/pricing-rules')
    } catch (error: unknown) {
      setSubmitError(adminShippingApi.getApiErrorMessage(error, 'Could not save pricing rule.'))
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
        <Link to="/super-admin/shipping/pricing-rules" className="hover:text-slate-700">
          Delivery Pricing
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{mode === 'create' ? 'New rule' : 'Edit rule'}</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading pricing rule...
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
              to="/super-admin/shipping/pricing-rules"
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
                onClick={() => navigate('/super-admin/shipping/pricing-rules')}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back to rules
              </button>
              <h1 className="text-xl font-bold text-slate-900">
                {mode === 'create' ? 'New pricing rule' : 'Edit pricing rule'}
              </h1>
              <p className="mt-0.5 text-sm text-slate-600">
                Base settings for this rule. Manage its weight rate from the weight rates screen.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/super-admin/shipping/pricing-rules')}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting
                  ? 'Saving…'
                  : mode === 'create'
                    ? 'Create rule'
                    : 'Save changes'}
              </button>
            </div>
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {submitError}
            </p>
          )}

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Basic details</h2>
            <p className={sectionHintClass}>
              Name, currency, status, and fee bounds for this rule. Active rules of the same service
              type cannot have overlapping effective dates.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="rule-name" className={labelClass}>
                  Name
                </label>
                <input
                  id="rule-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Standard delivery"
                  required
                />
              </div>

              <div>
                <label htmlFor="rule-currency" className={labelClass}>
                  Currency
                </label>
                <input
                  id="rule-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  maxLength={3}
                  className={inputClass}
                  placeholder="MMK"
                  required
                />
              </div>

              <div>
                <label htmlFor="rule-status" className={labelClass}>
                  Status
                </label>
                <select
                  id="rule-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PricingRuleStatus)}
                  className={inputClass}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div>
                <label htmlFor="rule-min-fee" className={labelClass}>
                  Minimum fee
                </label>
                <input
                  id="rule-min-fee"
                  type="number"
                  min={0}
                  step="any"
                  value={minimumFee}
                  onChange={(e) => setMinimumFee(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="rule-max-fee" className={labelClass}>
                  Maximum fee
                </label>
                <input
                  id="rule-max-fee"
                  type="number"
                  min={0}
                  step="any"
                  value={maximumFee}
                  onChange={(e) => setMaximumFee(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="rule-effective-from" className={labelClass}>
                  Effective from
                </label>
                <input
                  id="rule-effective-from"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="rule-effective-until" className={labelClass}>
                  Effective until
                  <span className="ml-1 font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="rule-effective-until"
                  type="date"
                  value={effectiveUntil}
                  onChange={(e) => setEffectiveUntil(e.target.value)}
                  className={inputClass}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Leave empty for open-ended. Must not overlap another active STANDARD rule.
                </p>
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Weight & dimensional settings</h2>
            <p className={sectionHintClass}>
              How package weight and volume are rounded before the fee is calculated.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="rule-divisor" className={labelClass}>
                  Dimensional divisor
                </label>
                <input
                  id="rule-divisor"
                  type="number"
                  min={0}
                  step="any"
                  value={dimensionalDivisor}
                  onChange={(e) => setDimensionalDivisor(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="rule-rounding-method" className={labelClass}>
                  Rounding method
                </label>
                <select
                  id="rule-rounding-method"
                  value={weightRoundingMethod}
                  onChange={(e) => setWeightRoundingMethod(e.target.value as WeightRoundingMethod)}
                  className={inputClass}
                >
                  {ROUNDING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="rule-rounding-increment" className={labelClass}>
                  Rounding increment (kg)
                </label>
                <input
                  id="rule-rounding-increment"
                  type="number"
                  min={0}
                  step="any"
                  value={weightRoundingIncrement}
                  onChange={(e) => setWeightRoundingIncrement(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/super-admin/shipping/pricing-rules')}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting
                ? 'Saving…'
                : mode === 'create'
                  ? 'Create pricing rule'
                  : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default AdminPricingRuleFormPage
