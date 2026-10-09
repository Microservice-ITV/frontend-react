import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import SearchableSelect from '@/components/ui/SearchableSelect'
import {
  adminShippingApi,
  type AdminWeightRateDto,
  type DeliveryPricingRuleDto,
} from '../api/adminShippingApi'

type WeightRateFormPageProps = {
  mode: 'create' | 'edit'
}

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
const labelClass = 'block text-xs font-medium text-slate-600'
const sectionClass = 'rounded-xl border border-slate-200 bg-white p-5 sm:p-6'

const AdminWeightRateFormPage = ({ mode }: WeightRateFormPageProps) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(mode === 'edit')
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [rules, setRules] = useState<DeliveryPricingRuleDto[]>([])
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({})
  const [pricingRuleId, setPricingRuleId] = useState('')
  const [baseWeightKg, setBaseWeightKg] = useState('1')
  const [baseFee, setBaseFee] = useState('1000')
  const [additionalWeightKg, setAdditionalWeightKg] = useState('0.5')
  const [additionalFee, setAdditionalFee] = useState('500')
  const [currency, setCurrency] = useState('MMK')

  useEffect(() => {
    void adminShippingApi
      .listPricingRules({ pageSize: 100 })
      .then((res) => setRules(res.data.data.rules))
      .catch(() => setRules([]))
    void adminShippingApi
      .listDeliveryCompanies({ page: 1, pageSize: 100 })
      .then((res) => {
        const names: Record<string, string> = {}
        for (const company of res.data.data.companies ?? []) {
          names[company.id] = company.name
        }
        setCompanyNames(names)
      })
      .catch(() => setCompanyNames({}))
  }, [])

  useEffect(() => {
    if (mode !== 'edit' || !id) return

    let cancelled = false
    const run = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const res = await adminShippingApi.getWeightRate(id)
        const rate: AdminWeightRateDto | undefined = res.data?.data
        if (!rate) {
          if (!cancelled) setLoadError('Weight rate not found.')
          return
        }
        if (cancelled) return
        setPricingRuleId(rate.pricingRuleId)
        setBaseWeightKg(String(rate.baseWeightKg))
        setBaseFee(String(rate.baseFee))
        setAdditionalWeightKg(String(rate.additionalWeightKg))
        setAdditionalFee(String(rate.additionalFee))
        setCurrency(rate.pricingRule?.currency ?? 'MMK')
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(adminShippingApi.getApiErrorMessage(error, 'Failed to load weight rate.'))
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

  const pricingRuleOptions = useMemo(
    () => [
      { value: '', label: 'Select a pricing rule' },
      ...rules.map((rule) => {
        const companyName = companyNames[rule.deliveryCompanyId]
        const label = companyName
          ? `${companyName} — ${rule.name} (v${rule.version} · ${rule.status})`
          : `${rule.name} (v${rule.version} · ${rule.status})`
        return { value: rule.id, label }
      }),
    ],
    [companyNames, rules],
  )

  const validate = (): string | null => {
    if (!pricingRuleId) return 'Pricing rule is required.'
    const weightFields: [string, string][] = [
      ['Base weight (kg)', baseWeightKg],
      ['Base fee', baseFee],
      ['Additional weight (kg)', additionalWeightKg],
      ['Additional fee', additionalFee],
    ]
    for (const [label, value] of weightFields) {
      const parsed = Number(value)
      if (!Number.isFinite(parsed) || parsed < 0) return `${label} must be a non-negative number.`
    }
    if (Number(baseWeightKg) <= 0) return 'Base weight must be greater than zero.'
    if (Number(additionalWeightKg) <= 0) return 'Additional weight must be greater than zero.'
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
        baseWeightKg: Number(baseWeightKg),
        baseFee: Number(baseFee),
        additionalWeightKg: Number(additionalWeightKg),
        additionalFee: Number(additionalFee),
      }
      if (mode === 'edit') {
        if (!id) {
          setSubmitError('Invalid weight rate id.')
          return
        }
        await adminShippingApi.updateWeightRate(id, payload)
      } else {
        await adminShippingApi.createWeightRate({ ...payload, pricingRuleId })
      }
      navigate('/super-admin/shipping/weight-rates')
    } catch (error: unknown) {
      setSubmitError(adminShippingApi.getApiErrorMessage(error, 'Could not save weight rate.'))
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
        <Link to="/super-admin/shipping/weight-rates" className="hover:text-slate-700">
          Weight Rates
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{mode === 'create' ? 'New weight rate' : 'Edit weight rate'}</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading weight rate...
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
              to="/super-admin/shipping/weight-rates"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Back to list
            </Link>
          </div>
        </div>
      )}

      {!loading && !loadError && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <button
              type="button"
              onClick={() => navigate('/super-admin/shipping/weight-rates')}
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <ArrowLeft size={14} />
              Back to weight rates
            </button>
            <h1 className="text-xl font-bold text-slate-900">
              {mode === 'create' ? 'New weight rate' : 'Edit weight rate'}
            </h1>
            <p className="mt-0.5 text-sm text-slate-600">
              Base fee covers the first tier; additional fee applies to each extra increment.
            </p>
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {submitError}
            </p>
          )}

          <section className={sectionClass}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="weight-rate-rule" className={labelClass}>
                  Pricing rule
                </label>
                <SearchableSelect
                  id="weight-rate-rule"
                  className="mt-1"
                  placeholder="Select a pricing rule"
                  emptyLabel="Select a pricing rule"
                  options={pricingRuleOptions}
                  value={pricingRuleId}
                  onChange={setPricingRuleId}
                  disabled={mode === 'edit'}
                  searchAriaLabel="Search pricing rule"
                />
                {mode === 'edit' && (
                  <p className="mt-1 text-xs text-slate-400">
                    The pricing rule cannot be changed after creation.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="weight-rate-base-weight" className={labelClass}>
                  Base weight (kg)
                </label>
                <input
                  id="weight-rate-base-weight"
                  type="number"
                  min={0}
                  step="any"
                  value={baseWeightKg}
                  onChange={(e) => setBaseWeightKg(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="weight-rate-base-fee" className={labelClass}>
                  Base fee ({currency || 'MMK'})
                </label>
                <input
                  id="weight-rate-base-fee"
                  type="number"
                  min={0}
                  step="any"
                  value={baseFee}
                  onChange={(e) => setBaseFee(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="weight-rate-additional-weight" className={labelClass}>
                  Additional weight (kg)
                </label>
                <input
                  id="weight-rate-additional-weight"
                  type="number"
                  min={0}
                  step="any"
                  value={additionalWeightKg}
                  onChange={(e) => setAdditionalWeightKg(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="weight-rate-additional-fee" className={labelClass}>
                  Additional fee ({currency || 'MMK'})
                </label>
                <input
                  id="weight-rate-additional-fee"
                  type="number"
                  min={0}
                  step="any"
                  value={additionalFee}
                  onChange={(e) => setAdditionalFee(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/super-admin/shipping/weight-rates')}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create weight rate' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default AdminWeightRateFormPage
