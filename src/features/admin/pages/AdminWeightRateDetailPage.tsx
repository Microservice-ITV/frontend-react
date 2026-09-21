import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Scale, Pencil, Trash2 } from 'lucide-react'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { adminShippingApi, type AdminWeightRateDto } from '../api/adminShippingApi'

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatMoney = (value: number, currency: string): string =>
  `${new Intl.NumberFormat('en-US').format(value)} ${currency}`

const AdminWeightRateDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [rate, setRate] = useState<AdminWeightRateDto | null>(null)

  useEffect(() => {
    if (!id) {
      setLoadError('Invalid weight rate id.')
      setLoading(false)
      return
    }

    let cancelled = false
    const run = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const res = await adminShippingApi.getWeightRate(id)
        const data = res.data?.data ?? null
        if (!cancelled) {
          setRate(data)
          if (!data) setLoadError('Weight rate not found.')
        }
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
  }, [id])

  const currency = rate?.pricingRule?.currency ?? 'MMK'
  const ruleName = rate?.pricingRule?.name ?? 'Pricing rule'

  const confirmDelete = () => {
    if (!id || !rate) return
    openModal({
      title: 'Delete this weight rate?',
      content: (
        <p>
          This removes the weight rate for “{ruleName}”. The rule can be left without a weight
          rate, but quotes will not calculate until you add one again.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await adminShippingApi.deleteWeightRate(id)
        navigate('/super-admin/shipping/weight-rates')
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
        <Link to="/super-admin/shipping/weight-rates" className="hover:text-slate-700">
          Weight Rates
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Weight rate</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading weight rate...
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {!loading && !loadError && rate && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Scale size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Weight rate</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  {ruleName} · v{rate.pricingRule?.version ?? '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/super-admin/shipping/weight-rates/${id}/edit`)}
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
              <h2 className="text-base font-bold text-slate-900">Weight rate details</h2>
              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Base weight</p>
                    <p className="mt-1 text-sm text-slate-900">{rate.baseWeightKg} kg</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Base fee</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {formatMoney(rate.baseFee, currency)}
                    </p>
                  </div>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Additional weight</p>
                    <p className="mt-1 text-sm text-slate-900">{rate.additionalWeightKg} kg</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Additional fee</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {formatMoney(rate.additionalFee, currency)}
                    </p>
                  </div>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Created</p>
                    <p className="mt-1 text-sm text-slate-900">{formatDate(rate.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Updated</p>
                    <p className="mt-1 text-sm text-slate-900">{formatDate(rate.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-bold text-slate-900">Pricing rule</h2>
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <p className="font-semibold text-slate-900">{ruleName}</p>
                  <p>
                    v{rate.pricingRule?.version ?? '—'} · {rate.pricingRule?.serviceType ?? '—'} ·{' '}
                    {currency}
                  </p>
                </div>
                <Link
                  to="/super-admin/shipping/pricing-rules"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                >
                  View pricing rules
                </Link>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminWeightRateDetailPage
