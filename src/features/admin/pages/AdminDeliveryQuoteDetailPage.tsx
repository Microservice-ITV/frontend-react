import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ban } from 'lucide-react'
import { useAppDispatch } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import {
  adminShippingApi,
  type DeliveryQuoteDto,
  type DeliveryQuoteStatus,
} from '../api/adminShippingApi'
import { loadAllDistricts, type DistrictOptionWithCity } from '../api/locationOptions'
import { cancelAdminDeliveryQuote } from '../store/adminDeliveryQuotesThunks'

const statusBadgeClass = (status: DeliveryQuoteStatus): string => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-700'
    case 'USED':
      return 'bg-sky-100 text-sky-700'
    case 'EXPIRED':
      return 'bg-amber-100 text-amber-800'
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const formatDateTime = (value: string): string => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatMoney = (value: number, currency: string): string =>
  `${new Intl.NumberFormat('en-US').format(value)} ${currency}`

const formatCoord = (lat: number, lng: number): string =>
  `${lat.toFixed(5)}, ${lng.toFixed(5)}`

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="grid grid-cols-1 gap-1 border-b border-slate-100 py-3 last:border-0 sm:grid-cols-[160px_1fr] sm:gap-4">
    <dt className="text-xs font-medium text-slate-500">{label}</dt>
    <dd className="text-sm text-slate-900">{value}</dd>
  </div>
)

const AdminDeliveryQuoteDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { openModal } = useGlobalModal()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [quote, setQuote] = useState<DeliveryQuoteDto | null>(null)
  const [actionError, setActionError] = useState('')
  const [districts, setDistricts] = useState<DistrictOptionWithCity[]>([])

  useEffect(() => {
    void loadAllDistricts().then(setDistricts).catch(() => setDistricts([]))
  }, [])

  const districtName = (districtId: string | null): string => {
    if (!districtId) return '—'
    const district = districts.find((row) => row.id === districtId)
    return district ? `${district.name}, ${district.cityName}` : districtId
  }

  const load = async () => {
    if (!id) {
      setLoadError('Invalid quote id.')
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError('')
    try {
      const res = await adminShippingApi.getDeliveryQuote(id)
      setQuote(res.data?.data ?? null)
      if (!res.data?.data) setLoadError('Delivery quote not found.')
    } catch (error: unknown) {
      setLoadError(adminShippingApi.getApiErrorMessage(error, 'Failed to load delivery quote.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const confirmCancel = () => {
    if (!quote) return
    openModal({
      title: `Cancel quote ${quote.quoteNumber}?`,
      content: (
        <p>
          This marks the quote as cancelled so it can no longer be used at checkout.
        </p>
      ),
      primaryLabel: 'Cancel quote',
      primaryVariant: 'danger',
      secondaryLabel: 'Keep',
      onPrimary: async () => {
        setActionError('')
        try {
          const updated = await dispatch(cancelAdminDeliveryQuote(quote.id)).unwrap()
          setQuote(updated)
        } catch (error: unknown) {
          setActionError(
            typeof error === 'string'
              ? error
              : adminShippingApi.getApiErrorMessage(error, 'Could not cancel quote.'),
          )
        }
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
        <Link to="/super-admin/shipping/quotes" className="hover:text-slate-700">
          Delivery Quotes
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">{quote?.quoteNumber ?? 'Detail'}</span>
      </nav>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading quote...
        </div>
      )}

      {!loading && loadError && (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{loadError}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Retry
            </button>
            <Link
              to="/super-admin/shipping/quotes"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Back to list
            </Link>
          </div>
        </div>
      )}

      {!loading && !loadError && quote && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate('/super-admin/shipping/quotes')}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back to quotes
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-xl font-bold text-slate-900">{quote.quoteNumber}</h1>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(quote.status)}`}
                >
                  {quote.status}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-600">
                Created {formatDateTime(quote.createdAt)} · expires {formatDateTime(quote.expiresAt)}
              </p>
            </div>
            {quote.status === 'ACTIVE' && (
              <button
                type="button"
                onClick={confirmCancel}
                className="inline-flex items-center gap-1.5 self-start rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <Ban size={16} />
                Cancel quote
              </button>
            )}
          </div>

          {actionError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {actionError}
            </p>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-slate-900">Quote summary</h2>
              <dl className="mt-2">
                <DetailRow
                  label="Total fee"
                  value={
                    <span className="text-base font-semibold">
                      {formatMoney(quote.totalFee, quote.currency)}
                    </span>
                  }
                />
                <DetailRow label="Base fee" value={formatMoney(quote.baseFee, quote.currency)} />
                <DetailRow
                  label={quote.calculationMethod === 'CITY_ROUTE' ? 'Route fee' : 'Distance fee'}
                  value={formatMoney(quote.distanceFee, quote.currency)}
                />
                <DetailRow label="Weight fee" value={formatMoney(quote.weightFee, quote.currency)} />
                <DetailRow
                  label="Additional fee"
                  value={formatMoney(quote.additionalFee, quote.currency)}
                />
                <DetailRow label="Currency" value={quote.currency} />
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-slate-900">Route & weight</h2>
              <dl className="mt-2">
                {quote.calculationMethod === 'CITY_ROUTE' ? (
                  <>
                    <DetailRow label="Method" value="City route" />
                    <DetailRow label="From district" value={districtName(quote.fromDistrictId)} />
                    <DetailRow label="To district" value={districtName(quote.toDistrictId)} />
                  </>
                ) : (
                  <>
                    <DetailRow label="Method" value="Real route" />
                    <DetailRow label="Distance" value={`${quote.distanceKm.toFixed(2)} km`} />
                    <DetailRow label="Duration" value={`${quote.durationMinutes} min`} />
                  </>
                )}
                <DetailRow
                  label="Pickup"
                  value={
                    <span className="font-mono text-xs">
                      {formatCoord(quote.pickupLatitude, quote.pickupLongitude)}
                    </span>
                  }
                />
                <DetailRow
                  label="Destination"
                  value={
                    <span className="font-mono text-xs">
                      {formatCoord(quote.destinationLatitude, quote.destinationLongitude)}
                    </span>
                  }
                />
                <DetailRow label="Actual weight" value={`${quote.actualWeightKg.toFixed(3)} kg`} />
                <DetailRow
                  label="Volumetric weight"
                  value={`${quote.volumetricWeightKg.toFixed(3)} kg`}
                />
                <DetailRow
                  label="Chargeable weight"
                  value={`${quote.chargeableWeightKg.toFixed(3)} kg`}
                />
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 lg:col-span-2">
              <h2 className="text-sm font-semibold text-slate-900">Products</h2>
              {quote.items && quote.items.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {quote.items.map((item, index) => (
                    <li
                      key={`${item.productId}-${item.variantId ?? index}`}
                      className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.productName ?? item.productId}
                        </p>
                        {item.variantId && (
                          <p className="truncate font-mono text-[11px] text-slate-400">
                            {item.variantId}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-slate-500">
                        × {item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">—</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 lg:col-span-2">
              <h2 className="text-sm font-semibold text-slate-900">References</h2>
              <dl className="mt-2">
                <DetailRow
                  label="Shop"
                  value={
                    quote.shopName ?? (
                      <span className="font-mono text-xs">{quote.shopId}</span>
                    )
                  }
                />
                <DetailRow
                  label="Customer"
                  value={
                    quote.customerName ??
                    (quote.customerId ? (
                      <span className="font-mono text-xs">{quote.customerId}</span>
                    ) : (
                      'Guest'
                    ))
                  }
                />
                <DetailRow
                  label="Delivery company"
                  value={quote.deliveryCompanyName ?? quote.deliveryCompanyId}
                />
                <DetailRow
                  label="Pricing rule"
                  value={
                    <Link
                      to={`/super-admin/shipping/pricing-rules/${quote.pricingRule.id}/edit`}
                      className="text-emerald-700 hover:underline"
                    >
                      {quote.pricingRule.name} (v{quote.pricingVersion})
                    </Link>
                  }
                />
                <DetailRow label="Updated" value={formatDateTime(quote.updatedAt)} />
              </dl>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDeliveryQuoteDetailPage
