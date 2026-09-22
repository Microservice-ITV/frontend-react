import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import DataTablePagination from '@/components/ui/DataTablePagination'
import {
  Users,
  Search,
  Eye,
  Mail,
  CalendarDays,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  UserCog,
} from 'lucide-react'
import {
  selectAdminUsers,
  selectAdminUsersStatus,
  selectAdminUsersError,
  selectAdminUsersTotal,
  selectAdminUsersLastPage,
} from '../store/adminUsersSelectors'
import { fetchAdminUsers } from '../store/adminUsersThunks'
import type { AdminUserRow } from '../types/userTypes'
import ManageRolesModal from '../components/ManageRolesModal'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { useCan } from '@/app/rbac/hooks'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROWS_PER_PAGE = 10

type VerifiedFilter = 'all' | 'verified' | 'unverified'

const VERIFIED_TABS: { key: VerifiedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'verified', label: 'Verified' },
  { key: 'unverified', label: 'Unverified' },
]

// ─── Scope badge colours (reused from RBAC page) ──────────────────────────────

const SCOPE_COLORS: Record<string, string> = {
  platform: 'bg-indigo-100 text-indigo-700',
  shop: 'bg-emerald-100 text-emerald-700',
  self: 'bg-amber-100 text-amber-800',
}

// ─── Main page ────────────────────────────────────────────────────────────────

const AdminUsersPage = () => {
  const dispatch = useAppDispatch()
  const { openModal } = useGlobalModal()
  const canManageRoles = useCan(CAPABILITIES.PLATFORM_ADMIN_VIEW)

  const users = useAppSelector(selectAdminUsers)
  const status = useAppSelector(selectAdminUsersStatus)
  const error = useAppSelector(selectAdminUsersError)
  const total = useAppSelector(selectAdminUsersTotal)
  const lastPage = useAppSelector(selectAdminUsersLastPage)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>('all')
  const [page, setPage] = useState(1)

  // ── Debounce search input ──────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearch = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 350)
  }

  // ── Fetch users whenever query params change ───────────────────────────────
  const verifiedParam = useMemo<'1' | '0' | ''>(() => {
    if (verifiedFilter === 'verified') return '1'
    if (verifiedFilter === 'unverified') return '0'
    return ''
  }, [verifiedFilter])

  const doFetch = useCallback(() => {
    dispatch(
      fetchAdminUsers({
        page,
        perPage: ROWS_PER_PAGE,
        search: debouncedSearch || undefined,
        verified: verifiedParam || undefined,
      }),
    )
  }, [dispatch, page, debouncedSearch, verifiedParam])

  useEffect(() => {
    doFetch()
  }, [doFetch])

  // ── View user modal ────────────────────────────────────────────────────────
  const handleViewUser = (user: AdminUserRow) => {
    openModal({
      title: `User details · ${user.name}`,
      content: <UserDetailModal user={user} />,
      primaryLabel: 'Close',
      hideSecondary: true,
    })
  }

  // ── Manage roles modal (shop-role assignments) ─────────────────────────────
  const handleManageRoles = (user: AdminUserRow) => {
    openModal({
      title: `Manage roles · ${user.name}`,
      content: (
        <ManageRolesModal
          user={{ id: user.id, name: user.name, email: user.email }}
          onAssigned={doFetch}
        />
      ),
      size: 'xl',
      // The modal body renders its own action footer (assign + inline feedback).
      hidePrimary: true,
      secondaryLabel: 'Close',
    })
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const verifiedCount = users.filter((u) => u.isVerified).length

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Users</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Users size={22} className="text-slate-400" />
            User Administration
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            All platform users fetched live from auth-service.{' '}
            {status === 'succeeded' && (
              <>
                Showing page {page} of {lastPage} · {total} total user
                {total !== 1 ? 's' : ''}.
              </>
            )}
          </p>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={doFetch}
          disabled={status === 'loading'}
          className="flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats strip */}
      {status === 'succeeded' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatChip
            icon={<Users size={16} className="text-indigo-500" />}
            label="Total users"
            value={total}
            bg="bg-indigo-50"
          />
          <StatChip
            icon={<CheckCircle2 size={16} className="text-emerald-500" />}
            label="Verified (this page)"
            value={verifiedCount}
            bg="bg-emerald-50"
          />
          <StatChip
            icon={<XCircle size={16} className="text-amber-500" />}
            label="Unverified (this page)"
            value={users.length - verifiedCount}
            bg="bg-amber-50"
          />
        </div>
      )}

      {/* Table card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">All Users</p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-52">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {VERIFIED_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setVerifiedFilter(tab.key)
                    setPage(1)
                  }}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${
                    verifiedFilter === tab.key
                      ? 'bg-slate-200 text-slate-900'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Roles</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Joined</th>
                <th className="w-24 px-4 py-3 text-left text-xs font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Loading */}
              {status === 'loading' && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading users from auth-service…
                  </td>
                </tr>
              )}

              {/* Error */}
              {status === 'failed' && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-red-600">
                    {error ?? 'Unable to load users.'}
                  </td>
                </tr>
              )}

              {/* Empty */}
              {status !== 'loading' && status !== 'failed' && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    No users found for the current filter.
                  </td>
                </tr>
              )}

              {/* Rows */}
              {status !== 'loading' &&
                status !== 'failed' &&
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    {/* User cell */}
                    <td className="px-4 py-4">
                      <UserCell user={user} />
                    </td>

                    {/* Verified */}
                    <td className="px-4 py-4">
                      {user.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 size={12} />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          <XCircle size={12} />
                          Unverified
                        </span>
                      )}
                    </td>

                    {/* Roles */}
                    <td className="px-4 py-4">
                      <RoleChips user={user} />
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-4 text-xs text-slate-600">{user.created}</td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1"
                        role="group"
                        aria-label={`Actions for ${user.name}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleViewUser(user)}
                          aria-label={`View details for ${user.name}`}
                          title="View details"
                          className="cursor-pointer rounded-md p-1.5 text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                        >
                          <Eye size={16} aria-hidden="true" />
                        </button>
                        {canManageRoles && (
                          <button
                            type="button"
                            onClick={() => handleManageRoles(user)}
                            aria-label={`Manage roles for ${user.name}`}
                            title="Manage roles"
                            className="cursor-pointer rounded-md p-1.5 text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                          >
                            <UserCog size={16} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {status === 'succeeded' && lastPage > 1 && (
        <DataTablePagination
          page={page}
          totalPages={lastPage}
          rowsPerPage={ROWS_PER_PAGE}
          totalItems={total}
          onPageChange={(p) => setPage(p)}
          onRowsPerPageChange={() => {
            /* fixed at ROWS_PER_PAGE for now */
          }}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Coloured avatar initial + name + email */
const UserCell = ({ user }: { user: AdminUserRow }) => {
  const initial = (user.name?.[0] ?? user.email[0]).toUpperCase()
  // Stable colour derived from first char code
  const hues = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500']
  const bg = hues[initial.charCodeAt(0) % hues.length]

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${bg}`}
      >
        {initial}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-900">{user.name}</p>
        <p className="truncate text-[11px] text-slate-500">{user.email}</p>
      </div>
    </div>
  )
}

/** Role chips list — up to 3 visible, rest collapsed */
const RoleChips = ({ user }: { user: AdminUserRow }) => {
  if (user.roles.length === 0) {
    return <span className="text-xs text-slate-400">No roles</span>
  }
  const visible = user.roles.slice(0, 3)
  const overflow = user.roles.length - 3
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((role) => (
        <span
          key={role.id}
          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
            SCOPE_COLORS[role.scope] ?? 'bg-slate-100 text-slate-600'
          }`}
        >
          {role.name}
        </span>
      ))}
      {overflow > 0 && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
          +{overflow}
        </span>
      )}
    </div>
  )
}

/** Small stat pill */
const StatChip = ({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode
  label: string
  value: number
  bg: string
}) => (
  <div className={`flex items-center gap-2 rounded-xl p-3 ${bg}`}>
    {icon}
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-900">{value.toLocaleString()}</p>
    </div>
  </div>
)

// ─── View user modal content ──────────────────────────────────────────────────

const UserDetailModal = ({ user }: { user: AdminUserRow }) => {
  const initial = (user.name?.[0] ?? user.email[0]).toUpperCase()
  const hues = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500']
  const bg = hues[initial.charCodeAt(0) % hues.length]

  return (
    <div className="space-y-5">
      {/* Identity */}
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${bg}`}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{user.name}</p>
          <p className="truncate text-xs text-slate-500">User ID · {user.id}</p>
        </div>
      </div>

      {/* Details */}
      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        <InfoRow icon={<Mail size={14} className="text-slate-400" />} label="Email">
          <span className="text-slate-900">{user.email}</span>
        </InfoRow>
        <InfoRow icon={<BadgeCheck size={14} className="text-slate-400" />} label="Verified">
          {user.isVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 size={12} />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              <XCircle size={12} />
              Unverified
            </span>
          )}
        </InfoRow>
        <InfoRow icon={<CalendarDays size={14} className="text-slate-400" />} label="Joined">
          <span className="text-slate-900">{user.created}</span>
        </InfoRow>
        <InfoRow icon={<Users size={14} className="text-slate-400" />} label="Roles">
          <RoleChips user={user} />
        </InfoRow>
      </div>
    </div>
  )
}

const InfoRow = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3">
    <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
      {icon}
      {label}
    </span>
    <div className="flex flex-wrap items-center justify-end gap-1">{children}</div>
  </div>
)

export default AdminUsersPage
