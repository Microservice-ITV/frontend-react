import { useEffect, useState } from 'react'
import { Check, MapPinned, Route } from 'lucide-react'
import {
  adminShippingApi,
  type ShippingCalculationMethod,
  type ShippingSettingsDto,
} from '../api/adminShippingApi'

const OPTIONS: Array<{
  value: ShippingCalculationMethod
  title: string
  description: string
  icon: typeof Route
}> = [
  {
    value: 'REAL_ROUTE',
    title: 'Real Route',
    description: 'Road distance (OSRM) plus distance and weight rates.',
    icon: Route,
  },
  {
    value: 'CITY_ROUTE',
    title: 'City Route',
    description: 'Shop-city ↔ customer-city rate plus weight rates.',
    icon: MapPinned,
  },
]

/**
 * Admin-only checkout delivery calculation method.
 * Shown on the existing Admin Settings index.
 */
export function DeliveryCalculationMethodSettings() {
  const [settings, setSettings] = useState<ShippingSettingsDto | null>(null)
  const [selected, setSelected] = useState<ShippingCalculationMethod>('REAL_ROUTE')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await adminShippingApi.getShippingSettings()
        if (cancelled) return
        setSettings(res.data.data)
        setSelected(res.data.data.calculationMethod)
      } catch (e) {
        if (cancelled) return
        setError(
          adminShippingApi.getApiErrorMessage(e, 'Failed to load shipping settings.'),
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const dirty = settings != null && selected !== settings.calculationMethod

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSavedMessage(null)
    try {
      const res = await adminShippingApi.updateShippingSettings({
        calculationMethod: selected,
      })
      setSettings(res.data.data)
      setSelected(res.data.data.calculationMethod)
      setSavedMessage('Calculation method saved.')
    } catch (e) {
      setError(
        adminShippingApi.getApiErrorMessage(e, 'Failed to save shipping settings.'),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-base font-semibold text-slate-900">Delivery calculation</h2>
      <p className="mt-1 text-xs text-slate-500">
        How checkout calculates delivery fees. Customers do not see this.
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {savedMessage && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {savedMessage}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {loading && !settings ? (
          <p className="text-sm text-slate-500 sm:col-span-2">Loading…</p>
        ) : (
          OPTIONS.map((option) => {
            const isSelected = selected === option.value
            const Icon = option.icon
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSelected(option.value)
                  setSavedMessage(null)
                }}
                className={`flex h-full w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/60'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    isSelected ? 'border-emerald-600' : 'border-slate-300'
                  }`}
                >
                  {isSelected ? (
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <Icon className="h-3.5 w-3.5 text-slate-500" />
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-600">
                    {option.description}
                  </span>
                </span>
                {isSelected ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : null}
              </button>
            )
          })
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {settings?.updatedAt
            ? `Updated ${new Date(settings.updatedAt).toLocaleString()}`
            : '—'}
        </p>
        <button
          type="button"
          disabled={!dirty || saving || loading}
          onClick={() => void handleSave()}
          className="inline-flex items-center rounded-lg bg-emerald-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

export default DeliveryCalculationMethodSettings
