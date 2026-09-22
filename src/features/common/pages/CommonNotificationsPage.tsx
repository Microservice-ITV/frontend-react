import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ShoppingCart, UserPlus, AlertTriangle, CreditCard, Star, RefreshCw } from 'lucide-react'
import type { DashboardArea } from '@/features/dashboard/types/dashboardTypes'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchNotifications, fetchUnreadCount, markNotificationRead, type NotificationFilter } from '@/features/notifications/store/notificationSlice'
import type { NotificationRow } from '@/features/notifications/api/notificationApi'

type NotificationType = NotificationRow['type']
type NotificationListFilter = NotificationFilter

const iconMap: Record<NotificationType, typeof ShoppingCart> = {
  ORDER: ShoppingCart,
  PAYMENT: CreditCard,
  DELIVERY: ShoppingCart,
  WALLET: CreditCard,
  MARKETING: UserPlus,
  ACCOUNT: AlertTriangle,
}

const iconBgMap: Record<NotificationType, string> = {
  ORDER: 'bg-emerald-100 text-emerald-700',
  PAYMENT: 'bg-cyan-100 text-cyan-700',
  DELIVERY: 'bg-indigo-100 text-indigo-700',
  WALLET: 'bg-violet-100 text-violet-700',
  MARKETING: 'bg-blue-100 text-blue-700',
  ACCOUNT: 'bg-amber-100 text-amber-700',
}

const FILTERS: { key: NotificationListFilter; label: string }[] = [
  { key: 'all', label: 'All Notifications' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
]

type CommonNotificationsPageProps = {
  area: DashboardArea
  /**
   * Where "View all notifications" points. Defaults to the dashboard area's own list; the account
   * (customer) area must pass its own route, otherwise customers are sent to the seller-only page and
   * hit the capability guard.
   */
  viewAllPath?: string
}

const formatTimeAgo = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000))
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

const CommonNotificationsPage = ({ area, viewAllPath }: CommonNotificationsPageProps) => {
  const dispatch = useAppDispatch()
  const [filter, setFilter] = useState<NotificationListFilter>('all')
  const notifications = useAppSelector((state) => state.notifications.items)
  const loading = useAppSelector((state) => state.notifications.loading)
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount)
  const error = useAppSelector((state) => state.notifications.error)

  useEffect(() => {
    void dispatch(fetchNotifications())
    // Server-side unread total (the store count is otherwise only refreshed by the Socket.IO
    // `connected` handler, and the list response is capped at 50 rows).
    void dispatch(fetchUnreadCount())
  }, [dispatch])

  const filtered = useMemo(() => notifications.filter((item) => {
    if (filter === 'unread') return item.status === 'UNREAD'
    if (filter === 'read') return item.status === 'READ'
    return true
  }), [filter, notifications])

  const title = area === 'super_admin' ? 'Admin Notifications' : 'Notifications'
  const subtitle =
    area === 'super_admin'
      ? 'Stay up to date with platform-wide alerts and system messages.'
      : 'Stay up to date with your latest alerts and messages.'
  const resolvedViewAllPath =
    viewAllPath ?? (area === 'super_admin' ? '/super-admin/notifications' : '/seller/notifications')

  const markAsRead = (item: { id: string; status: NotificationRow['status'] }) => {
    if (item.status !== 'UNREAD') return
    void dispatch(markNotificationRead(item.id))
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-0.5 text-xs text-slate-600">{subtitle}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-900">
            All Notifications
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white">
                {unreadCount} new
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-slate-200 text-slate-900'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.key === 'all' ? 'All' : tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading && notifications.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center rounded-lg border border-slate-100 bg-white text-sm text-slate-500">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading notifications...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((item) => {
              const Icon = iconMap[item.type] ?? ShoppingCart
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markAsRead(item)}
                  className={`flex w-full cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors hover:bg-slate-50 ${
                    item.status === 'READ'
                      ? 'border-slate-100 bg-white'
                      : 'border-emerald-100 bg-emerald-50/40'
                  }`}
                >
                  <div className={`mt-0.5 rounded-md p-1.5 ${iconBgMap[item.type] ?? 'bg-slate-100 text-slate-700'}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900">
                      {item.title}
                      {item.status === 'UNREAD' && <span className="ml-1 text-emerald-600">●</span>}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{item.message}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{formatTimeAgo(item.createdAt)}</p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex min-h-52 items-center justify-center rounded-lg border border-slate-100 bg-white">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Bell size={18} />
              </div>
              <p className="text-sm font-semibold text-slate-900">No notifications</p>
              <p className="text-xs text-slate-500">All caught up</p>
            </div>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mt-4 text-center">
            <Link to={resolvedViewAllPath} className="text-xs font-medium text-emerald-700 hover:text-emerald-800">
              View all notifications
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default CommonNotificationsPage