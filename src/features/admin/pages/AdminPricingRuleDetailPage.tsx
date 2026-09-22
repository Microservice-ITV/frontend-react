import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Truck, Pencil, Trash2, Power, ArrowRight } from 'lucide-react'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import {
  adminShippingApi,
  type DeliveryPricingRuleDto,
  type WeightRoundingMethod,
} from '../api/adminShippingApi'

const ROUNDING_LABELS: Record<WeightRoundingMethod, string> = {
  ROUND_UP: 'Round up',
  ROUND_DOWN: 'Round down',
  ROUND_NEAREST: 'Round nearest',
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatMoney = (value: number, currency: string): string =>
  `${new Intl.NumberFormat('en-US').format(value)} ${currency}`

const AdminPricingRuleDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [rule, setRule] = useState<DeliveryPricingRuleDto | null>(null)

  useEffect(() => {
    if (!id) {
      setLoadError('Invalid pricing rule id.')
      setLoading(false)
      return
    }

    let cancelled = false
    const run = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const res = await adminShippingApi.getPricingRule(id)
        const data = res.data?.data ?? null
        if (!cancelled) {
          setRule(data)
          if (!data) setLoadError('Pricing rule not found.')
        }
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
  }, [id])

  const displayName = rule?.name?.trim() || 'Pricing rule'

  const confirmDelete = () => {
    if (!id || !rule) return
    openModal({
      title: `Delete “${displayName}”?`,
      content: (
        <p>
          This permanently removes version {rule.version}. Rules already used by quotes cannot be
          deleted — deactivate them instead.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await adminShippingApi.deletePricingRule(id)
        navigate('/super-admin/shipping/pricing-rules')
      },
    })
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
        <span className="text-slate-900">{displayName}</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading pricing rule...
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {!loading && !loadError && rule && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Truck size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">{displayName}</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  v{rule.version} · {rule.serviceType} · {rule.currency}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/super-admin/shipping/pricing-rules/${id}/edit`)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Pencil size={16} />
                Edit
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 cursor-pointer"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-bold text-slate-900">Rule details</h2>
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs font-medium text-slate-500">Status</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      rule.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rule.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Minimum fee</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {formatMoney(rule.minimumFee, rule.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Maximum fee</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {formatMoney(rule.maximumFee, rule.currency)}
                    </p>
                  </div>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Effective from</p>
                    <p className="mt-1 text-sm text-slate-900">{formatDate(rule.effectiveFrom)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Effective until</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {rule.effectiveUntil ? formatDate(rule.effectiveUntil) : 'Open'}
                    </p>
                  </div>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Dimensional divisor</p>
                    <p className="mt-1 text-sm text-slate-900">{rule.dimensionalDivisor}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Weight rounding</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {ROUNDING_LABELS[rule.weightRoundingMethod] ?? rule.weightRoundingMethod} ·{' '}
                      {rule.weightRoundingIncrement} kg
                    </p>
                  </div>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Created</p>
                    <p className="mt-1 text-sm text-slate-900">{formatDate(rule.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Updated</p>
                    <p className="mt-1 text-sm text-slate-900">{formatDate(rule.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-bold text-slate-900">Weight rate</h2>
                {rule.weightRate ? (
                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    <p>
                      {rule.weightRate.baseWeightKg} kg →{' '}
                      <span className="font-medium text-slate-900">
                        {formatMoney(rule.weightRate.baseFee, rule.currency)}
                      </span>
                    </p>
                    <p>
                      +{rule.weightRate.additionalWeightKg} kg →{' '}
                      <span className="font-medium text-slate-900">
                        {formatMoney(rule.weightRate.additionalFee, rule.currency)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">No weight rate configured.</p>
                )}
                <Link
                  to="/super-admin/shipping/weight-rates"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Manage weight rates
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-bold text-slate-900">Distance ranges</h2>
                {rule.distanceRates.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {rule.distanceRates.map((rate) => (
                      <div
                        key={rate.id ?? `${rate.minDistanceKm}-${rate.maxDistanceKm}`}
                        className="flex items-center justify-between text-xs text-slate-600"
                      >
                        <span>
                          {rate.minDistanceKm} – {rate.maxDistanceKm === null ? '∞' : rate.maxDistanceKm} km
                        </span>
                        <span className="font-medium text-slate-900">
                          {formatMoney(rate.fee, rule.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">No distance ranges configured.</p>
                )}
                <Link
                  to="/super-admin/shipping/distance-ranges"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                >
                  Manage distance ranges
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <Power size={18} className="text-slate-400" />
                  <p className="text-xs text-slate-500">
                    Toggle active status from the list page actions menu.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminPricingRuleDetailPage
