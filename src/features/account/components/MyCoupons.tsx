import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  promotionClaimsApi,
  type MyPromotionClaim,
} from '@/features/promotions/api/promotionClaimsApi'

const dateLabel = (value: string) => new Date(value).toLocaleDateString()

export const MyCoupons = () => {
  const [coupons, setCoupons] = useState<MyPromotionClaim[]>([])
  const [tab, setTab] = useState<'claimable' | 'available' | 'history'>(
    'claimable'
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const claimInFlight = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    promotionClaimsApi
      .mine()
      .then((rows) => {
        if (!cancelled) setCoupons(rows)
      })
      .catch(() => {
        if (!cancelled)
          setError('Could not load your coupons. Please refresh to try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reload])

  const claim = async (coupon: MyPromotionClaim) => {
    if (claimInFlight.current) return
    claimInFlight.current = true
    setClaimingId(coupon.id)
    setError('')
    setNotice('')
    try {
      const result = await promotionClaimsApi.claim(coupon.id)
      if (!mounted.current) return
      setCoupons((rows) =>
        rows.map((row) =>
          row.id === coupon.id
            ? {
                ...row,
                code: result.code,
                claimed_at: new Date().toISOString(),
                state: 'AVAILABLE',
              }
            : row
        )
      )
      setTab('available')
      setNotice('Coupon claimed. Your code is ready for your next purchase.')
      setReload((value) => value + 1)
    } catch (err: unknown) {
      if (!mounted.current) return
      const message = (err as { response?: { data?: { message?: unknown } } })
        ?.response?.data?.message
      setError(
        typeof message === 'string'
          ? message
          : 'Could not claim this coupon. Please try again.'
      )
    } finally {
      claimInFlight.current = false
      if (mounted.current) setClaimingId(null)
    }
  }

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setNotice('Coupon code copied.')
    } catch {
      setError('Could not copy the code. Select and copy it manually.')
    }
  }

  const visible = coupons.filter((coupon) =>
    tab === 'claimable'
      ? !coupon.claimed_at &&
        ['CLAIMABLE', 'UNAVAILABLE'].includes(coupon.state)
      : tab === 'available'
      ? coupon.state === 'AVAILABLE'
      : ['USED', 'EXPIRED', 'DISABLED'].includes(coupon.state)
  )

  return (
    <section className="mt-6" aria-label="My coupons">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">My Coupons</h2>
        <button
          type="button"
          onClick={() => setReload((value) => value + 1)}
          disabled={loading || Boolean(claimingId)}
          className="text-sm font-medium text-emerald-700 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Confirm receipt of eligible orders to unlock coupons. New rewards may
        take a moment to appear.
      </p>
      <div
        className="mt-4 flex gap-4 border-b border-slate-200"
        aria-label="Coupon filters"
      >
        {(['claimable', 'available', 'history'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={`border-b-2 pb-2 text-sm font-medium capitalize ${
              tab === value
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500'
            }`}
          >
            {value === 'available' ? 'My coupons' : value}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 text-sm text-emerald-700">
          {notice}
        </p>
      )}
      {loading ? (
        <p role="status" className="py-8 text-sm text-slate-500">
          Loading coupons…
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {visible.map((coupon) => (
            <article
              key={coupon.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">
                  {coupon.promotion_name}
                </h3>
                <span className="text-xs capitalize text-slate-500">
                  {coupon.state.toLowerCase()}
                </span>
              </div>
              {coupon.description && (
                <p className="mt-2 text-sm text-slate-600">
                  {coupon.description}
                </p>
              )}
              {coupon.rewards.map((reward) => (
                <p
                  key={reward.id}
                  className="mt-2 text-sm font-medium text-emerald-700"
                >
                  {reward.reward_type === 'FREE_SHIPPING'
                    ? 'Free shipping'
                    : reward.reward_type === 'PERCENTAGE'
                    ? `${reward.percentage}% off`
                    : `${Number(reward.fixed_amount).toLocaleString()} off`}
                  {reward.max_discount_amount
                    ? ` (up to ${Number(
                        reward.max_discount_amount
                      ).toLocaleString()})`
                    : ''}
                </p>
              ))}
              <Link
                to={`/account/orders/${coupon.order_id}`}
                className="mt-3 block text-xs text-emerald-700 underline"
              >
                View qualifying order
              </Link>
              {!coupon.claimed_at && coupon.claim_expires_at && (
                <p className="mt-2 text-xs text-slate-500">
                  Claim by {dateLabel(coupon.claim_expires_at)}
                </p>
              )}
              {coupon.promotion_end_at && (
                <p className="mt-1 text-xs text-slate-500">
                  Promotion ends {dateLabel(coupon.promotion_end_at)}
                </p>
              )}
              {coupon.code_expires_at && (
                <p className="mt-1 text-xs text-slate-500">
                  Code expires {dateLabel(coupon.code_expires_at)}
                </p>
              )}
              {coupon.code && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                  <code className="select-all break-all font-semibold text-slate-900">
                    {coupon.code}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(coupon.code!)}
                    className="text-sm font-medium text-emerald-700"
                  >
                    Copy
                  </button>
                </div>
              )}
              {coupon.state === 'CLAIMABLE' && (
                <button
                  type="button"
                  onClick={() => claim(coupon)}
                  disabled={Boolean(claimingId)}
                  className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {claimingId === coupon.id ? 'Claiming…' : 'Claim coupon'}
                </button>
              )}
              {coupon.state === 'UNAVAILABLE' && (
                <p className="mt-3 text-xs text-slate-500">
                  All codes are currently assigned. Check again later.
                </p>
              )}
              {coupon.state === 'AVAILABLE' && (
                <p className="mt-3 text-xs text-slate-500">
                  Enter this code at checkout. The promotion’s purchase
                  conditions and usage limits apply.
                </p>
              )}
            </article>
          ))}
          {!visible.length && !error && (
            <p className="py-6 text-sm text-slate-500">
              {tab === 'claimable'
                ? 'No claimable coupons yet. Confirm receipt of qualifying purchases to earn rewards.'
                : tab === 'available'
                ? 'Your claimed coupons will appear here.'
                : 'No coupon history yet.'}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
