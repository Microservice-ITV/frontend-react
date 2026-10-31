import { useEffect, useState } from 'react'
import { Copy, Ticket, Check } from 'lucide-react'
import { vouchersApi, type CustomerVoucher } from '../api/vouchersApi'

const dateLabel = (value?: string | null) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
  : null

export const CustomerVouchersPanel = ({ title = 'My Vouchers' }: { title?: string }) => {
  const [vouchers, setVouchers] = useState<CustomerVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    vouchersApi.mine()
      .then(items => { if (active) setVouchers(items) })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load your vouchers.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const copyCode = async (voucher: CustomerVoucher) => {
    try {
      await navigator.clipboard.writeText(voucher.code)
      setCopiedId(voucher.id)
      window.setTimeout(() => setCopiedId(current => current === voucher.id ? null : current), 1800)
    } catch {
      setError('Could not copy the voucher code. Please select and copy it manually.')
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Ticket className="h-6 w-6 text-violet-600" aria-hidden="true" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600">Vouchers earned from completed orders appear here.</p>
        </div>
      </div>

      {loading && <p role="status" className="text-sm text-gray-600">Loading your vouchers…</p>}
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && vouchers.length === 0 && (
        <section className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="font-medium text-gray-800">No vouchers yet</p>
          <p className="mt-1 text-sm text-gray-600">When an eligible order is fully delivered, its voucher will show up here.</p>
        </section>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {vouchers.map(voucher => {
          const expiry = dateLabel(voucher.expires_at || voucher.promotion?.end_at)
          return (
            <article key={voucher.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium text-gray-900">{voucher.promotion?.name || 'Order reward'}</h2>
                  {voucher.promotion?.description && <p className="mt-1 text-sm text-gray-600">{voucher.promotion.description}</p>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${voucher.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {voucher.status === 'ACTIVE' ? 'Available' : voucher.status === 'USED' ? 'Redeemed' : 'Unavailable'}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-dashed border-violet-300 bg-violet-50 px-3 py-2">
                <code className="break-all font-semibold tracking-wide text-violet-900">{voucher.code}</code>
                <button type="button" onClick={() => void copyCode(voucher)} disabled={voucher.status !== 'ACTIVE'} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-violet-700 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Copy ${voucher.code}`}>
                  {copiedId === voucher.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedId === voucher.id ? 'Copied' : 'Copy'}
                </button>
              </div>
              {expiry && <p className="mt-2 text-xs text-gray-500">Expires {expiry}</p>}
            </article>
          )
        })}
      </div>
    </main>
  )
}

const VouchersPage = () => <CustomerVouchersPanel />

export default VouchersPage
