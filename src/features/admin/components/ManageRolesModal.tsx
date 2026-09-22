import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  UserCog,
  UserRound,
  Copy,
  Store,
  Shield,
  Calendar,
} from 'lucide-react'
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/SearchableSelect'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { adminRbacApi, type RbacRoleDto } from '../api/adminRbacApi'
import {
  adminUsersApi,
  type AdminShopLookupDto,
  type AdminUserShopRoleDto,
} from '../api/adminUsersApi'
import { useAsyncOptions } from '../hooks/useAsyncOptions'
import type { AdminLookupStatus, AdminUserRow, AdminUserShopRoleRow } from '../types/userTypes'

// ─────────────────────────────────────────────────────────────────────────────
const LOOKUP_PER_PAGE = 20
const LOOKUP_DEBOUNCE_MS = 350
const SHOP_ROLE_SCOPE = 'shop'

type SelectedShop = {
  id: string
  label: string
}

type ManagedUser = Pick<AdminUserRow, 'id' | 'name' | 'email'>

// ─────────────────────────────────────────────────────────────────────────────
const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const shopLabel = (shop: AdminShopLookupDto): string =>
  shop.domain ? `${shop.name} · ${shop.domain}` : shop.name

const toOption = (value: string, label: string): SearchableSelectOption => ({ value, label })

const withSelectedOption = (
  options: SearchableSelectOption[],
  selected: SearchableSelectOption | null,
): SearchableSelectOption[] => {
  if (!selected || options.some((option) => option.value === selected.value)) return options
  return [selected, ...options]
}

const mapAssignment = (dto: AdminUserShopRoleDto): AdminUserShopRoleRow => ({
  shopId: dto.shop_id,
  shopName: dto.shop?.name ?? 'Unknown shop',
  shopDomain: dto.shop?.domain ?? null,
  roleCode: dto.role?.code ?? '',
  roleName: dto.role?.name ?? 'No role',
  status: dto.status,
  joined: formatDate(dto.joined_at),
})

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  suspended: 'bg-red-50 text-red-700',
}

const AVATAR_HUES = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500']

const avatarClass = (seed: string): string => {
  const first = (seed[0] ?? '?').toUpperCase()
  return AVATAR_HUES[first.charCodeAt(0) % AVATAR_HUES.length]
}

// ─────────────────────────────────────────────────────────────────────────────
type ManageRolesModalProps = {
  user: ManagedUser
  onAssigned?: () => void
}

const ManageRolesModal = ({ user, onAssigned }: ManageRolesModalProps) => {
  // Selection state
  const [selectedShop, setSelectedShop] = useState<SelectedShop | null>(null)
  const [roleCode, setRoleCode] = useState('')

  // Shop lookup
  const shopsByIdRef = useRef<Map<string, SelectedShop>>(new Map())
  const [shopQuery, setShopQuery] = useState('')
  const debouncedShopQuery = useDebouncedValue(shopQuery, LOOKUP_DEBOUNCE_MS)

  const loadShops = useCallback(async (query: string): Promise<SearchableSelectOption[]> => {
    try {
      const response = await adminUsersApi.listShopLookups({
        page: 1,
        per_page: LOOKUP_PER_PAGE,
        search: query || undefined,
      })
      const shops: AdminShopLookupDto[] = response.data?.data?.shops ?? []
      for (const shop of shops) {
        shopsByIdRef.current.set(shop.id, { id: shop.id, label: shopLabel(shop) })
      }
      return shops.map((shop) => toOption(shop.id, shopLabel(shop)))
    } catch (error: unknown) {
      throw new Error(adminUsersApi.getApiErrorMessage(error, 'Unable to search shops right now.'))
    }
  }, [])

  const shopLookup = useAsyncOptions(debouncedShopQuery, loadShops)

  const shopOptions = useMemo(
    () =>
      withSelectedOption(
        shopLookup.options,
        selectedShop ? toOption(selectedShop.id, selectedShop.label) : null,
      ),
    [shopLookup.options, selectedShop],
  )

  // Assignable roles
  const [roles, setRoles] = useState<RbacRoleDto[]>([])
  const [rolesStatus, setRolesStatus] = useState<AdminLookupStatus>('idle')
  const [rolesError, setRolesError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setRolesStatus('loading')
    setRolesError(null)

    adminRbacApi
      .listRoles({ scope: SHOP_ROLE_SCOPE })
      .then((response) => {
        if (cancelled) return
        setRoles(response.data?.data?.roles ?? [])
        setRolesStatus('succeeded')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setRoles([])
        setRolesError(adminRbacApi.getApiErrorMessage(error, 'Unable to load shop roles right now.'))
        setRolesStatus('failed')
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Current assignments
  const [assignments, setAssignments] = useState<AdminUserShopRoleRow[]>([])
  const [assignmentsStatus, setAssignmentsStatus] = useState<AdminLookupStatus>('idle')
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null)
  const [assignmentsRefreshKey, setAssignmentsRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setAssignmentsStatus('loading')
    setAssignmentsError(null)

    adminUsersApi
      .listUserShopRoles(user.id)
      .then((response) => {
        if (cancelled) return
        const assignments = (response.data?.data?.assignments ?? []).map(mapAssignment)
        setAssignments(assignments)
        setAssignmentsStatus('succeeded')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setAssignments([])
        setAssignmentsError(adminUsersApi.getApiErrorMessage(error, 'Unable to load current shop roles.'))
        setAssignmentsStatus('failed')
      })

    return () => {
      cancelled = true
    }
  }, [user.id, assignmentsRefreshKey])

  // Assignment handling
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)

  const roleOptions = useMemo(() => 
    roles.map((role) => toOption(role.code, role.name)), 
    [roles]
  )

  const selectedRole = useMemo(() => 
    roles.find((role) => role.code === roleCode), 
    [roles, roleCode]
  )

  const currentAssignment = useMemo(() => 
    assignments.find((assignment) => assignment.shopId === selectedShop?.id),
    [assignments, selectedShop]
  )

  const isSameRole = useMemo(() => 
    currentAssignment && selectedRole && currentAssignment.roleCode === selectedRole.code,
    [currentAssignment, selectedRole]
  )

  const canAssign = useMemo(() => 
    selectedShop && selectedRole && !isSameRole,
    [selectedShop, selectedRole, isSameRole]
  )

  const handleShopChange = useCallback((value: string) => {
    const shop = shopsByIdRef.current.get(value)
    setSelectedShop(shop || null)
    setAssignError(null)
    setAssignSuccess(null)
  }, [])

  const handleRoleChange = useCallback((value: string) => {
    setRoleCode(value)
    setAssignError(null)
    setAssignSuccess(null)
  }, [])

  const handleAssign = useCallback(async () => {
    if (!selectedShop || !selectedRole || isSameRole) return

    setAssigning(true)
    setAssignError(null)
    setAssignSuccess(null)

    try {
      const response = await adminUsersApi.assignShopRole(selectedShop.id, user.id, selectedRole.code)

      if (response.data?.success) {
        setAssignSuccess(currentAssignment
          ? `Role switched to ${selectedRole.name} for ${selectedShop.label}`
          : `Role ${selectedRole.name} assigned to ${user.name} in ${selectedShop.label}`)
        
        setAssignmentsRefreshKey((key) => key + 1)
        if (onAssigned) onAssigned()
      } else {
        throw new Error('Assignment failed without a clear error')
      }
    } catch (error: unknown) {
      const errorMessage = adminUsersApi.getApiErrorMessage(error, 'Unable to assign role right now.')
      setAssignError(errorMessage)
    } finally {
      setAssigning(false)
    }
  }, [selectedShop, selectedRole, isSameRole, user, currentAssignment, onAssigned])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── User Profile Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarClass(
              user.name || user.email,
            )}`}
          >
            {(user.name?.[0] ?? user.email[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-900">{user.name}</h3>
              <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                <UserRound size={10} className="text-slate-500" aria-hidden="true" />
                <span className="text-[10px] font-medium text-slate-600" title={`User ID: ${user.id}`}>
                  {user.id.slice(0, 6)}…
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(user.id)}
                  aria-label="Copy user ID"
                  className="ml-0.5 text-slate-400 hover:text-slate-600"
                >
                  <Copy size={10} aria-hidden="true" />
                </button>
              </div>
            </div>
            <p className="truncate text-sm text-slate-600">{user.email}</p>
          </div>
        </div>
      </div>

      {/* ── Assign a Shop Role Section ────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-slate-200"></div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Assign Shop Role
          </h4>
          <div className="h-px flex-1 bg-slate-200"></div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 lg:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-700">
                ①
              </div>
              <label
                htmlFor="manage-roles-shop"
                className="text-xs font-medium text-slate-700"
              >
                Shop
              </label>
            </div>
            <SearchableSelect
              id="manage-roles-shop"
              options={shopOptions}
              value={selectedShop?.id ?? ''}
              onChange={handleShopChange}
              onQueryChange={setShopQuery}
              onBlur={() => setShopQuery('')}
              loading={shopLookup.status === 'loading'}
              filterLocally={false}
              placeholder="Search shops…"
              emptyLabel="Select shop"
              searchAriaLabel="Search shops"
              className="w-full"
              menuClassName="fixed z-50"
            />
            {shopLookup.status === 'failed' && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {shopLookup.error}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-700">
                ②
              </div>
              <label
                htmlFor="manage-roles-role"
                className="text-xs font-medium text-slate-700"
              >
                Role
              </label>
            </div>
            <SearchableSelect
              id="manage-roles-role"
              options={roleOptions}
              value={roleCode}
              onChange={handleRoleChange}
              loading={rolesStatus === 'loading'}
              disabled={rolesStatus === 'failed'}
              placeholder="Select role…"
              emptyLabel="Select role"
              searchAriaLabel="Search shop roles"
              className="w-full"
              menuClassName="fixed z-50"
            />
            {rolesStatus === 'failed' && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {rolesError}
              </p>
            )}
            {rolesStatus === 'succeeded' && roleOptions.length === 0 && (
              <p className="mt-1 text-xs text-amber-700">
                No shop roles defined
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-medium text-indigo-700">
                ③
              </div>
              <span className="text-xs font-medium text-slate-700">
                Action
              </span>
            </div>
            <button
              type="button"
              onClick={handleAssign}
              disabled={!canAssign}
              title={isSameRole ? 'This role is already assigned' : 'Assign the selected role'}
              className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed ${
                isSameRole
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300'
              }`}
            >
              {assigning ? (
                <RefreshCw size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <UserCog size={14} aria-hidden="true" />
              )}
              {assigning ? 'Assigning…' : isSameRole ? 'Already Assigned' : 'Assign Role'}
            </button>
          </div>
        </div>

        {/* ── Assignment feedback ───────────────────────────────────────── */}
        {(isSameRole || currentAssignment || assignError || assignSuccess) && (
          <div className={`rounded-lg p-3 text-xs ${
            isSameRole ? 'bg-emerald-50 text-emerald-700' :
            assignError ? 'bg-red-50 text-red-700' :
            assignSuccess ? 'bg-emerald-50 text-emerald-700' :
            'bg-slate-50 text-slate-700'
          }`}>
            {isSameRole && (
              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} aria-hidden="true" />
                <span>
                  <span className="font-medium">{user.name}</span> already has <span className="font-medium">{selectedRole?.name}</span> in <span className="font-medium">{selectedShop?.label}</span>
                </span>
              </div>
            )}
            {!isSameRole && currentAssignment && selectedRole && (
              <div className="flex items-center gap-2">
                <AlertCircle size={12} className="text-amber-600" aria-hidden="true" />
                <span>
                  Switch from <span className="font-medium">{currentAssignment.roleName}</span> to <span className="font-medium">{selectedRole.name}</span> for <span className="font-medium">{selectedShop?.label}</span>
                </span>
              </div>
            )}
            {!isSameRole && !currentAssignment && selectedRole && selectedShop && (
              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} aria-hidden="true" />
                <span>
                  Assign <span className="font-medium">{selectedRole.name}</span> to <span className="font-medium">{user.name}</span> in <span className="font-medium">{selectedShop.label}</span>
                </span>
              </div>
            )}
            {assignError && (
              <div className="flex items-center gap-2">
                <AlertCircle size={12} aria-hidden="true" />
                <span>{assignError}</span>
              </div>
            )}
            {assignSuccess && (
              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} aria-hidden="true" />
                <span>{assignSuccess}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Current Shop Roles Section ──────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-px w-3 bg-slate-200"></div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current Shop Roles
            </h4>
            <div className="h-px flex-1 bg-slate-200"></div>
            {assignmentsStatus === 'succeeded' && assignments.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {assignments.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAssignmentsRefreshKey((key) => key + 1)}
            disabled={assignmentsStatus === 'loading'}
            aria-label="Refresh shop-role assignments"
            title="Refresh assignments"
            className="cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              aria-hidden="true"
              className={assignmentsStatus === 'loading' ? 'animate-spin' : ''}
            />
          </button>
        </div>

        {assignmentsStatus === 'loading' && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-slate-500">Loading assignments…</p>
          </div>
        )}

        {assignmentsStatus === 'failed' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p role="alert" className="text-sm text-red-600">
              {assignmentsError}
            </p>
          </div>
        )}

        {assignmentsStatus === 'succeeded' && assignments.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-slate-500">No shop roles assigned yet</p>
          </div>
        )}

        {assignmentsStatus === 'succeeded' && assignments.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <caption className="sr-only">Shop-role assignments held by this user</caption>
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Store size={12} className="text-slate-500" aria-hidden="true" />
                        <span>Shop</span>
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Shield size={12} className="text-slate-500" aria-hidden="true" />
                        <span>Role</span>
                      </div>
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-500" aria-hidden="true" />
                        <span>Joined</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((assignment) => (
                    <tr
                      key={assignment.shopId}
                      className={`hover:bg-slate-50 ${assignment.shopId === selectedShop?.id ? 'bg-emerald-50' : ''}`}
                    >
                      <td className="px-3 py-2.5">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-slate-900">{assignment.shopName}</p>
                          {assignment.shopDomain && (
                            <p className="text-xs text-slate-500">{assignment.shopDomain}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                          {assignment.roleName}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                            STATUS_STYLES[assignment.status] ?? 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">{assignment.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageRolesModal
