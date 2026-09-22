import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchNotificationPreferences, updateNotificationPreferences } from '@/features/notifications/store/notificationSlice'

const NotificationsPage = () => {
  const dispatch = useAppDispatch()
  const preferences = useAppSelector((state) => state.notifications.preferences)

  useEffect(() => {
    void dispatch(fetchNotificationPreferences())
  }, [dispatch])

  const toggle = (key: 'enableEmail' | 'enableInApp' | 'enablePush' | 'enableMarketing') => {
    if (!preferences) return
    void dispatch(updateNotificationPreferences({ [key]: !preferences[key] }))
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-medium text-gray-900 mb-2">Notification Settings</h1>
      <p className="text-sm text-gray-600 mb-6">
        Configure how you receive updates about your orders, promotions, and account activity.
      </p>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        {preferences ? (
          <>
            {[
              ['Email updates', 'enableEmail'],
              ['In-app notifications', 'enableInApp'],
              ['Push notifications', 'enablePush'],
              ['Marketing and promotions', 'enableMarketing'],
            ].map(([label, key]) => (
              <button
                key={String(key)}
                type="button"
                onClick={() => toggle(key as 'enableEmail' | 'enableInApp' | 'enablePush' | 'enableMarketing')}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/30"
              >
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <span className={`inline-flex h-6 w-11 items-center rounded-full ${preferences[key as keyof typeof preferences] ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                  <span className={`ml-1 h-4 w-4 rounded-full bg-white transition ${preferences[key as keyof typeof preferences] ? 'translate-x-5' : ''}`} />
                </span>
              </button>
            ))}
          </>
        ) : (
          <div className="text-sm text-slate-500">Loading your notification preferences…</div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage

