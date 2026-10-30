import { useEffect, useState } from 'react'
import {
  promotionClaimsApi,
  type PromotionClaimSettings,
} from '../api/promotionClaimsApi'

export const PromotionClaimSettingsPanel = ({
  promotionId,
  promotionName,
  onSaved,
  onCancel,
}: {
  promotionId: string
  promotionName: string
  onSaved?: (settings: PromotionClaimSettings) => void
  onCancel?: () => void
}) => {
  const [enabled, setEnabled] = useState(false)
  const [minimum, setMinimum] = useState('0')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadFailed(false)
    setError('')
    setSuccess('')
    promotionClaimsApi
      .settings(promotionId)
      .then((settings) => {
        if (cancelled) return
        setEnabled(settings.enabled)
        setMinimum(String(settings.minimum_order_amount))
        setDeadline(
          settings.claim_deadline_days === null
            ? ''
            : String(settings.claim_deadline_days),
        )
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true)
          setError('Could not load claim settings.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [promotionId, reload])

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving || loading || loadFailed) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const saved = await promotionClaimsApi.saveSettings(promotionId, {
        enabled,
        minimum_order_amount: Number(minimum),
        claim_deadline_days: deadline === '' ? null : Number(deadline),
      })
      setSuccess('Claim settings saved.')
      onSaved?.(saved)
    } catch {
      setError('Could not save claim settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className="mt-4 border-t border-slate-100 pt-4"
      aria-label={`Claim settings for ${promotionName}`}
    >
      <p className="text-xs text-slate-500">
        Let customers claim an existing code for {promotionName} after
        confirming receipt.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {loadFailed && (
        <button
          type="button"
          onClick={() => setReload((value) => value + 1)}
          className="mt-2 text-sm font-semibold text-emerald-700"
        >
          Retry
        </button>
      )}
      {success && (
        <p role="status" className="mt-3 text-sm text-emerald-700">
          {success}
        </p>
      )}
      <form onSubmit={save}>
        <fieldset
          disabled={loading || saving || loadFailed}
          className="mt-4 space-y-4 disabled:opacity-60"
        >
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => {
                setEnabled(event.target.checked)
                setSuccess('')
              }}
              className="accent-emerald-600"
            />
            Enable claiming after receipt
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-700">
              Minimum received-order amount
              <input
                type="number"
                min="0"
                max="999999999999.99"
                step="0.01"
                required
                value={minimum}
                onChange={(event) => setMinimum(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-100"
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                After discounts, excluding shipping and tax. Seller promotions
                use only that shop’s amount.
              </span>
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Claim within (days)
              <input
                type="number"
                min="1"
                max="3650"
                step="1"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                placeholder="No additional deadline"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-100"
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Starts at receipt confirmation. The promotion’s end date still
                applies.
              </span>
            </label>
          </div>
          <p className="text-xs text-slate-500">
            One claim per customer per promotion. Applies to new receipt
            confirmations. Existing rewards, conditions, targets, and usage
            limits control future purchases. Claimed codes remain assigned when
            claiming is switched off.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Loading…'
                : saving
                ? 'Saving…'
                : 'Save claim settings'}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  )
}
