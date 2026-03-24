import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ShoppingCart, UserPlus, AlertTriangle, CreditCard, Star } from 'lucide-react'

type NotificationType = 'order' | 'payment' | 'signup' | 'system' | 'review'
type NotificationStatus = 'all' | 'unread' | 'read'

type NotificationItem = {
  id: string
  title: string
  message: string
  timeAgo: string
  type: NotificationType
  read: boolean
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', title: 'New order received', message: 'Emma Wilson placed order #ORD-7811 for $299.00', timeAgo: '1 min ago', type: 'order', read: false },
  { id: 'n2', title: 'Payment processed', message: 'Payment of $1,499.00 from Sofia Garcia confirmed.', timeAgo: '3 mins ago', type: 'payment', read: false },
  { id: 'n3', title: 'New customer signup', message: 'James Chen created an account.', timeAgo: '8 mins ago', type: 'signup', read: false },
  { id: 'n4', title: 'Order shipped', message: 'ORD-7889 has been shipped to Sofia Garcia.', timeAgo: '12 mins ago', type: 'order', read: true },
  { id: 'n5', title: 'System update', message: 'Dashboard v2.1 has been deployed successfully.', timeAgo: '25 mins ago', type: 'system', read: true },
  { id: 'n6', title: 'Payment failed', message: 'Payment attempt for ORD-7888 from Alex Thompson failed.', timeAgo: '31 mins ago', type: 'payment', read: true },
  { id: 'n7', title: 'New review', message: 'Maria Santos left a 5-star review: "Excellent product!"', timeAgo: '41 mins ago', type: 'review', read: true },
  { id: 'n8', title: 'Subscription renewed', message: 'Team Plan for James Chen renewed for another month.', timeAgo: '1 hour ago', type: 'system', read: true },
  { id: 'n9', title: 'Server maintenance', message: 'Scheduled maintenance window: Jan 20, 03:00 AM - 04:00 AM UTC', timeAgo: '2 hours ago', type: 'system', read: true },
  { id: 'n10', title: 'Bulk export complete', message: 'Your customer data export is ready to download.', timeAgo: '3 hours ago', type: 'system', read: true },
]

const iconMap: Record<NotificationType, typeof ShoppingCart> = {
  order: ShoppingCart,
  payment: CreditCard,
  signup: UserPlus,
  system: AlertTriangle,
  review: Star,
}

const iconBgMap: Record<NotificationType, string> = {
  order: 'bg-emerald-100 text-emerald-700',
  payment: 'bg-cyan-100 text-cyan-700',
  signup: 'bg-blue-100 text-blue-700',
  system: 'bg-amber-100 text-amber-700',
  review: 'bg-purple-100 text-purple-700',
}

const FILTERS: { key: NotificationStatus; label: string }[] = [
  { key: 'all', label: 'All Notifications' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
]

const SellerNotificationsPage = () => {
  const [filter, setFilter] = useState<NotificationStatus>('all')
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS)

  const filtered = notifications.filter((item) => {
    if (filter === 'unread') return !item.read
    if (filter === 'read') return item.read
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    )
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-0.5 text-xs text-slate-600">
          Stay up to date with your latest alerts and messages.
        </p>
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

        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((item) => {
              const Icon = iconMap[item.type]
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markAsRead(item.id)}
                  className={`flex w-full cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors hover:bg-slate-50 ${
                    item.read
                      ? 'border-slate-100 bg-white'
                      : 'border-emerald-100 bg-emerald-50/40'
                  }`}
                >
                  <div className={`mt-0.5 rounded-md p-1.5 ${iconBgMap[item.type]}`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900">
                      {item.title}
                      {!item.read && <span className="ml-1 text-emerald-600">●</span>}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{item.message}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{item.timeAgo}</p>
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
            <Link to="/seller/notifications" className="text-xs font-medium text-emerald-700 hover:text-emerald-800">
              View all notifications
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

export default SellerNotificationsPage