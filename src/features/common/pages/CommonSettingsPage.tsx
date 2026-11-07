import { useEffect, useState } from 'react'
import type { DashboardArea } from '@/features/dashboard/types/dashboardTypes'
import {
  checkoutPhoneWindowApi,
  checkoutPhoneWindowError,
} from '@/features/admin/api/checkoutPhoneWindowApi'
import {
  checkoutPlaceOrderCountApi,
  checkoutPlaceOrderCountError,
} from '@/features/admin/api/checkoutPlaceOrderCountApi'

type CommonSettingsPageProps = {
  area: DashboardArea
}

const CommonSettingsPage = ({ area }: CommonSettingsPageProps) => {
  const isAdmin = area === 'super_admin'
  const [windowMinutes, setWindowMinutes] = useState('5')
  const [windowStatus, setWindowStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [windowError, setWindowError] = useState('')
  const [windowMessage, setWindowMessage] = useState('')
  const [savingWindow, setSavingWindow] = useState(false)
  const [orderCount, setOrderCount] = useState('3')
  const [countUsesDefault, setCountUsesDefault] = useState(true)
  const [countStatus, setCountStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [countError, setCountError] = useState('')
  const [countMessage, setCountMessage] = useState('')
  const [savingCount, setSavingCount] = useState(false)
  const [removingCount, setRemovingCount] = useState(false)

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    const load = async () => {
      setWindowStatus('loading')
      setWindowError('')
      try {
        const result = await checkoutPhoneWindowApi.get()
        if (cancelled) return
        setWindowMinutes(String(result.window_minutes))
        setWindowStatus('ready')
      } catch (error: unknown) {
        if (cancelled) return
        setWindowError(checkoutPhoneWindowError(error, 'Unable to load the phone verification window.'))
        setWindowStatus('failed')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    const load = async () => {
      setCountStatus('loading')
      setCountError('')
      try {
        const result = await checkoutPlaceOrderCountApi.get()
        if (cancelled) return
        setOrderCount(String(result.place_order_count))
        setCountUsesDefault(result.using_default)
        setCountStatus('ready')
      } catch (error: unknown) {
        if (cancelled) return
        setCountError(checkoutPlaceOrderCountError(error, 'Unable to load the place order count.'))
        setCountStatus('failed')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isAdmin])

  const saveWindow = async () => {
    setWindowMessage('')
    setWindowError('')
    const minutes = Number(windowMinutes)
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 10080) {
      setWindowError('Enter a whole number of minutes from 1 to 10080.')
      return
    }
    setSavingWindow(true)
    try {
      const saved = await checkoutPhoneWindowApi.save(minutes)
      setWindowMinutes(String(saved.window_minutes))
      setWindowMessage('Phone verification window saved.')
    } catch (error: unknown) {
      setWindowError(checkoutPhoneWindowError(error, 'Could not save the phone verification window.'))
    } finally {
      setSavingWindow(false)
    }
  }

  const saveCount = async () => {
    setCountMessage('')
    setCountError('')
    const count = Number(orderCount)
    if (!Number.isInteger(count) || count < 1 || count > 100) {
      setCountError('Enter a whole number from 1 to 100.')
      return
    }
    setSavingCount(true)
    try {
      const saved = countUsesDefault
        ? await checkoutPlaceOrderCountApi.create(count)
        : await checkoutPlaceOrderCountApi.update(count)
      setOrderCount(String(saved.place_order_count))
      setCountUsesDefault(saved.using_default)
      setCountMessage(countUsesDefault ? 'Place order count created.' : 'Place order count updated.')
    } catch (error: unknown) {
      setCountError(checkoutPlaceOrderCountError(error, 'Could not save the place order count.'))
    } finally {
      setSavingCount(false)
    }
  }

  const removeCount = async () => {
    setCountMessage('')
    setCountError('')
    setRemovingCount(true)
    try {
      const saved = await checkoutPlaceOrderCountApi.remove()
      setOrderCount(String(saved.place_order_count))
      setCountUsesDefault(saved.using_default)
      setCountMessage('Saved place order count removed. The default of 3 is in use.')
    } catch (error: unknown) {
      setCountError(checkoutPlaceOrderCountError(error, 'Could not remove the place order count.'))
    } finally {
      setRemovingCount(false)
    }
  }

  const title = isAdmin ? 'Admin Settings' : 'Settings'
  const subtitle =
    area === 'super_admin'
      ? 'Manage platform-level configuration and preferences.'
      : 'Manage account settings and dashboard preferences.'

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-semibold text-slate-900">Profile</h2>
          <p className="mt-1 text-xs text-slate-500">Basic profile information</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Display Name</label>
              <input
                type="text"
                placeholder="Your display name"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-semibold text-slate-900">Preferences</h2>
          <p className="mt-1 text-xs text-slate-500">Notification and interface options</p>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              Email notifications
              <input type="checkbox" className="h-4 w-4 accent-emerald-600" defaultChecked />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              In-app notifications
              <input type="checkbox" className="h-4 w-4 accent-emerald-600" defaultChecked />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              Weekly summary
              <input type="checkbox" className="h-4 w-4 accent-emerald-600" />
            </label>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-semibold text-slate-900">Phone verification</h2>
          <p className="mt-1 text-xs text-slate-500">
            After this many minutes of checkouts, the customer must verify their phone once they reach the place order count.
          </p>
          {windowStatus === 'loading' && (
            <p className="mt-4 text-sm text-slate-500">Loading window...</p>
          )}
          {windowStatus === 'failed' && (
            <p className="mt-4 text-sm text-red-600">{windowError}</p>
          )}
          {windowStatus === 'ready' && (
            <div className="mt-4 max-w-xs">
              <label htmlFor="phone-verification-window" className="mb-1 block text-xs font-medium text-slate-700">
                Window (minutes)
              </label>
              <input
                id="phone-verification-window"
                type="number"
                min={1}
                max={10080}
                step={1}
                value={windowMinutes}
                onChange={(event) => {
                  setWindowMinutes(event.target.value)
                  setWindowMessage('')
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
              <p className="mt-2 text-xs text-slate-500">Use 5 for the original 5-minute window.</p>
              {windowError && <p className="mt-2 text-sm text-red-600">{windowError}</p>}
              {windowMessage && <p className="mt-2 text-sm text-emerald-700">{windowMessage}</p>}
              <button
                type="button"
                onClick={() => void saveWindow()}
                disabled={savingWindow}
                className="mt-4 cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingWindow ? 'Saving...' : 'Save window'}
              </button>
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-semibold text-slate-900">Place order count</h2>
          <p className="mt-1 text-xs text-slate-500">
            When a customer reaches this many place orders inside the phone verification window, they must verify their phone. The default is 3.
          </p>
          {countStatus === 'loading' && (
            <p className="mt-4 text-sm text-slate-500">Loading count...</p>
          )}
          {countStatus === 'failed' && (
            <p className="mt-4 text-sm text-red-600">{countError}</p>
          )}
          {countStatus === 'ready' && (
            <div className="mt-4 max-w-xs">
              <label htmlFor="place-order-count" className="mb-1 block text-xs font-medium text-slate-700">
                Count
              </label>
              <input
                id="place-order-count"
                type="number"
                min={1}
                max={100}
                step={1}
                value={orderCount}
                onChange={(event) => {
                  setOrderCount(event.target.value)
                  setCountMessage('')
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
              <p className="mt-2 text-xs text-slate-500">
                {countUsesDefault
                  ? 'Using the default of 3. Save to create a custom count.'
                  : 'A custom count is saved. Update it, or remove it to go back to 3.'}
              </p>
              {countError && <p className="mt-2 text-sm text-red-600">{countError}</p>}
              {countMessage && <p className="mt-2 text-sm text-emerald-700">{countMessage}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => void saveCount()}
                  disabled={savingCount || removingCount}
                  className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {savingCount ? 'Saving...' : countUsesDefault ? 'Create count' : 'Update count'}
                </button>
                {!countUsesDefault && (
                  <button
                    type="button"
                    onClick={() => void removeCount()}
                    disabled={savingCount || removingCount}
                    className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {removingCount ? 'Removing...' : 'Delete count'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Save Changes
        </button>
      </div>
    </section>
  )
}

export default CommonSettingsPage
