import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ShoppingCart, UserPlus, AlertTriangle, CreditCard, RefreshCw } from 'lucide-react'
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

/**
 * `/account/notifications-center` renders inside `AccountLayout`, whose content card adds no inner
 * padding of its own — unlike the seller/admin `DashboardLayout`, which already pads its main area.
 * The Account variant therefore owns its spacing and follows the slate / brand-green styling shared
 * with `AccountSidebar` and the other Account pages, while the dashboard areas keep the original
 * chrome. The account area is the only caller that passes a `viewAllPath` (see props above).
 */
const buildNotificationStyles = (isAccountView: boolean) => ({
  shell: isAccountView ? 'min-w-0 space-y-5 p-4 sm:p-6' : 'space-y-5',
  header: isAccountView ? 'border-b border-slate-100 pb-5' : '',
  heading: isAccountView ? 'text-xl font-bold tracking-tight text-slate-900' : 'text-xl font-bold text-slate-900',
  subtitle: isAccountView ? 'mt-1 text-xs text-slate-500 sm:text-sm' : 'mt-0.5 text-xs text-slate-600',
  card: isAccountView
    ? 'overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm'
    : 'rounded-xl border border-slate-200 bg-white p-4',
  cardHeader: isAccountView
    ? 'flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
    : 'mb-4 flex flex-wrap items-center justify-between gap-3',
  cardTitle: isAccountView ? 'text-sm font-semibold text-slate-900' : 'text-xs font-semibold text-slate-900',
  badge: isAccountView
    ? 'ml-1.5 inline-flex items-center rounded-full bg-[#e8f7f0] px-2 py-0.5 text-[10px] font-semibold text-[#008f51]'
    : 'ml-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white',
  filterButton: (isActive: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs transition-colors ${
      isAccountView
        ? isActive
          ? 'border border-transparent bg-[#e8f7f0] font-semibold text-[#008f51]'
          : 'border border-slate-200 bg-white font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900'
        : isActive
          ? 'bg-slate-200 font-medium text-slate-900'
          : 'bg-white font-medium text-slate-600 hover:bg-slate-100'
    }`,
  list: isAccountView ? 'divide-y divide-slate-100' : 'space-y-2',
  row: (isUnread: boolean) =>
    isAccountView
      ? `flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors ${
          isUnread ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'bg-white hover:bg-slate-50'
        }`
      : `flex w-full cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors hover:bg-slate-50 ${
          isUnread ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-100 bg-white'
        }`,
  rowIcon: isAccountView ? 'mt-0.5 shrink-0 rounded-lg p-2' : 'mt-0.5 rounded-md p-1.5',
  rowIconSize: isAccountView ? 16 : 14,
  rowTitle: isAccountView ? 'break-words text-sm font-semibold text-slate-900' : 'text-xs font-semibold text-slate-900',
  rowMessage: 'mt-0.5 truncate text-xs text-slate-500',
  rowTime: 'mt-1 text-[10px] text-slate-400',
  errorWrap: isAccountView ? 'p-4' : '',
  empty: isAccountView
    ? 'px-4 py-12'
    : 'flex min-h-52 items-center justify-center rounded-lg border border-slate-100 bg-white',
  emptyIcon: isAccountView
    ? 'mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400'
    : 'mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500',
  emptyIconSize: isAccountView ? 20 : 18,
  emptyTitle: isAccountView ? 'mt-3 text-sm font-semibold text-slate-900' : 'text-sm font-semibold text-slate-900',
  emptyHint: isAccountView ? 'mt-1 text-xs text-slate-500' : 'text-xs text-slate-500',
  footer: isAccountView
    ? 'flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between'
    : 'mt-4 text-center',
  footerLink: isAccountView
    ? 'text-xs font-semibold text-[#008f51] hover:underline'
    : 'text-xs font-medium text-emerald-700 hover:text-emerald-800',
})

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

  const isAccountView = Boolean(viewAllPath?.startsWith('/account'))
  const styles = buildNotificationStyles(isAccountView)

  const emptyState = isAccountView
    ? filter === 'unread'
      ? { title: 'No unread notifications', hint: 'You have caught up with everything.' }
      : filter === 'read'
        ? { title: 'No read notifications', hint: 'Notifications you open will show up here.' }
        : { title: 'No notifications yet', hint: 'Order, payment and account updates will show up here.' }
    : { title: 'No notifications', hint: 'All caught up' }

  return (
    <section className={styles.shell}>
      <div className={styles.header}>
        <div className="min-w-0">
          <h1 className={styles.heading}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <p className={styles.cardTitle}>
            All Notifications
            {unreadCount > 0 && (
              <span className={styles.badge}>
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
                className={styles.filterButton(filter === tab.key)}
              >
                {tab.key === 'all' ? 'All' : tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading && notifications.length === 0 ? (
          isAccountView ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((row) => (
                <div key={row} className="h-14 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="flex min-h-52 items-center justify-center rounded-lg border border-slate-100 bg-white text-sm text-slate-500">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading notifications...
            </div>
          )
        ) : error ? (
          <div className={styles.errorWrap}>
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-4 text-sm text-red-700">
              {error}
            </div>
          </div>
        ) : filtered.length > 0 ? (
          <div className={styles.list}>
            {filtered.map((item) => {
              const Icon = iconMap[item.type] ?? ShoppingCart
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markAsRead(item)}
                  className={styles.row(item.status !== 'READ')}
                >
                  <div className={`${styles.rowIcon} ${iconBgMap[item.type] ?? 'bg-slate-100 text-slate-700'}`}>
                    <Icon size={styles.rowIconSize} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={styles.rowTitle}>
                      {item.title}
                      {item.status === 'UNREAD' && <span className="ml-1 text-emerald-600">●</span>}
                    </p>
                    <p className={styles.rowMessage}>{item.message}</p>
                    <p className={styles.rowTime}>{formatTimeAgo(item.createdAt)}</p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className={styles.empty}>
            <div className="text-center">
              <div className={styles.emptyIcon}>
                <Bell size={styles.emptyIconSize} />
              </div>
              <p className={styles.emptyTitle}>{emptyState.title}</p>
              <p className={styles.emptyHint}>{emptyState.hint}</p>
            </div>
          </div>
        )}

        {filtered.length > 0 && (
          <div className={styles.footer}>
            {isAccountView && (
              <p>
                Showing {filtered.length} of {notifications.length} notifications
              </p>
            )}
            <Link to={resolvedViewAllPath} className={styles.footerLink}>
              View all notifications
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default CommonNotificationsPage