import { useState, useRef, useEffect } from 'react'
import { Menu, Search, Plus, Bell, Settings, LogOut, ShoppingCart, CreditCard, UserPlus, Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { logout } from '@/features/auth/store/authThunks'
import type { DashboardArea } from '../../types/dashboardTypes'
import { getTopbarRouteConfig } from '../../config/topbarRouteConfig'

type DashboardTopbarProps = {
  area: DashboardArea
  onMenuClick: () => void
}

type TopbarNotification = {
  id: string
  title: string
  message: string
  timeAgo: string
  type: 'order' | 'payment' | 'signup'
  read: boolean
}

const INITIAL_NOTIFICATIONS: TopbarNotification[] = [
  { id: 'n1', title: 'New order received', message: 'Emma Wilson placed order ORD-7891 for $299.00', timeAgo: '2 min ago', type: 'order', read: false },
  { id: 'n2', title: 'Payment processed', message: 'Payment of $1,499.00 from Sofia Garcia confirmed.', timeAgo: '15 min ago', type: 'payment', read: false },
  { id: 'n3', title: 'New customer signup', message: 'James Chen created an account.', timeAgo: '1 hour ago', type: 'signup', read: false },
  { id: 'n4', title: 'Order shipped', message: 'ORD-7889 has been shipped to Sofia Garcia.', timeAgo: '2 hours ago', type: 'order', read: true },
]

const DashboardTopbar = ({ area, onMenuClick }: DashboardTopbarProps) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const authUser = useAppSelector((state) => state.auth.user)
  const [notifications, setNotifications] = useState<TopbarNotification[]>(INITIAL_NOTIFICATIONS)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const initials = authUser?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U'

  const displayName = authUser?.name ?? 'User'
  const displayEmail = authUser?.email ?? ''
  const unreadCount = notifications.filter((n) => !n.read).length
  const topbarRoutes = getTopbarRouteConfig(area)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen || notificationOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileOpen, notificationOpen])

  const handleLogout = () => {
    setProfileOpen(false)
    dispatch(logout())
    navigate('/login')
  }

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    )
  }

  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
  }

  const getNotificationIcon = (type: TopbarNotification['type']) => {
    if (type === 'payment') return CreditCard
    if (type === 'signup') return UserPlus
    return ShoppingCart
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Left: menu + search */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="shrink-0 rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="relative min-w-0 flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Search anything..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-10 pr-4 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
          />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500 sm:inline-block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: New Order + notification + profile */}
      <div className="flex shrink-0 items-center gap-2">
        {/* <Link
          to={topbarRoutes.newOrderPath}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">New Order</span>
        </Link> */}

        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationOpen((o) => !o)}
            className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Notifications"
            aria-expanded={notificationOpen}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          {notificationOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex cursor-pointer items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                >
                  <Check size={16} />
                  Mark all read
                </button>
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {notifications.map((item) => {
                  const Icon = getNotificationIcon(item.type)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        markNotificationRead(item.id)
                    navigate(topbarRoutes.notificationsPath)
                        setNotificationOpen(false)
                      }}
                      className={`flex w-full cursor-pointer items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors ${
                        item.read ? 'bg-white' : 'bg-emerald-50/30 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold leading-tight text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-600">{item.message}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.timeAgo}</p>
                      </div>
                      {!item.read && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-600" />}
                    </button>
                  )
                })}
              </div>

              <div className="border-t border-slate-200 px-4 py-3 text-center">
                <Link
                  to={topbarRoutes.notificationsPath}
                  onClick={() => setNotificationOpen(false)}
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700 cursor-pointer"
            aria-label="Profile"
            aria-expanded={profileOpen}
          >
            {initials}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{displayEmail}</p>
              </div>
              <div className="py-1">
                <Link
                  to={topbarRoutes.settingsPath}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Settings size={16} className="text-slate-500" />
                  Settings
                </Link>
                <Link
                  to={topbarRoutes.notificationsPath}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Bell size={16} className="text-slate-500" />
                  Notifications
                  <span className="ml-auto rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white">
                    4
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <LogOut size={16} className="text-slate-500" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default DashboardTopbar