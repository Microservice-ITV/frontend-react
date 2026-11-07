import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { authClient } from '@/lib/api/authClient'
import * as XLSX from 'xlsx'
import type { UserRole, UserRow, UserStatus } from '../types/userTypes'
import {
  Plus,
  Search,
  Columns3,
  Download,
  Pencil,
  Trash2,
  UserCheck,
} from 'lucide-react'

type SellerUserRow = UserRow & {
  shopId: string
  reportingTo: string | null
  roleCode: string
  roleName: string
}

type ShopRoleOption = {
  code: string
  name: string
}

type ShopRolesResponse = {
  data?: {
    roles?: ShopRoleOption[]
  }
}

type ShopMembership = {
  shop_id?: string | null
  shop_name?: string | null
  membership_status?: string | null
}

type ShopAccessResponse = {
  data?: {
    access_context?: {
      active_shop?: ShopMembership | null
      shops?: ShopMembership[]
    }
  }
}

type RegisteredUserOption = {
  id: string
  name: string
  email: string
}

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'NU'

const normalizeRole = (role?: { code?: string; name?: string } | null): UserRole => {
  const code = (role?.code ?? role?.name ?? '').toLowerCase()
  if (code.includes('owner')) return 'admin'
  if (code.includes('admin')) return 'admin'
  if (code.includes('editor')) return 'editor'
  if (code.includes('moderator')) return 'moderator'
  if (code.includes('staff')) return 'viewer'
  return 'viewer'
}

const preferredCreateRoleCode = (roles: ShopRoleOption[]): string =>
  roles.find((role) => role.code === 'staff')?.code
  ?? roles.find((role) => role.code === 'shop_admin')?.code
  ?? roles[0]?.code
  ?? ''

const normalizeStatus = (status?: string | null): UserStatus => {
  if (status === 'inactive') return 'inactive'
  if (status === 'suspended') return 'suspended'
  return 'active'
}

const formatLastActive = (value?: string | null): string => {
  if (!value) return 'just now'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'just now'

  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000))
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

  return 'recently'
}

const mapShopUserToRow = (shopUser: any): SellerUserRow => {
  const user = shopUser.user ?? {}
  const role = shopUser.role ?? null
  const manager = shopUser.manager ?? null
  const name = user.name ?? 'Unknown User'

  return {
    id: shopUser.id ?? user.id ?? `shop-user-${Date.now()}`,
    name,
    email: user.email ?? '',
    initials: getInitials(name),
    role: normalizeRole(role),
    roleCode: role?.code ?? '',
    roleName: role?.name ?? 'Unknown role',
    department: user.department ?? role?.name ?? 'Operations',
    status: normalizeStatus(shopUser.status),
    lastActive: formatLastActive(shopUser.updated_at ?? shopUser.joined_at ?? shopUser.created_at),
    shopId: shopUser.shop_id ?? 'unknown-shop',
    reportingTo: manager?.id ?? shopUser.reporting_to ?? null,
  }
}

const STATUS_STYLES: Record<UserStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  suspended: 'bg-red-100 text-red-700',
}

const ROLE_STYLES: Record<UserRole, string> = {
  admin: 'bg-emerald-100 text-emerald-700',
  editor: 'bg-slate-100 text-slate-700',
  moderator: 'bg-amber-100 text-amber-700',
  viewer: 'bg-slate-100 text-slate-700',
}

const FILTER_TABS: { key: 'all' | UserStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'suspended', label: 'Suspended' },
]

const EMPTY_DRAFT = {
  name: '',
  email: '',
  department: '',
  roleCode: '',
  status: 'active' as UserStatus,
  reportingTo: null as string | null,
}

const SellerUsersPage = () => {
  const authUser = useAppSelector((state) => state.auth.user)
  const [shops, setShops] = useState<ShopMembership[]>([])
  const [selectedShopId, setSelectedShopId] = useState('')
  const [isLoadingShops, setIsLoadingShops] = useState(true)

  const [users, setUsers] = useState<SellerUserRow[]>([])
  const [shopRoles, setShopRoles] = useState<ShopRoleOption[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | UserStatus>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [emailSearch, setEmailSearch] = useState('')
  const [userSuggestions, setUserSuggestions] = useState<RegisteredUserOption[]>([])
  const [isLookingUpUsers, setIsLookingUpUsers] = useState(false)
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)
  const [selectedRegisteredUserId, setSelectedRegisteredUserId] = useState<string | null>(null)
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    reportingTo: true,
    status: true,
    lastActive: true,
  })
  const usersRequestId = useRef(0)

  useEffect(() => {
    let active = true
    const loadShops = async () => {
      setIsLoadingShops(true)
      try {
        const response = await authClient.get<ShopAccessResponse>('/me/access-context')
        const context = response.data.data?.access_context
        const availableShops = (context?.shops ?? []).filter((shop) => {
          const status = shop.membership_status?.toLowerCase()
          return Boolean(shop.shop_id?.trim()) && (!status || status === 'active')
        })
        if (!active) return

        setShops(availableShops)
        const preferredShopId =
          authUser?.active_shop_id?.trim() || context?.active_shop?.shop_id?.trim() || ''
        setSelectedShopId(
          availableShops.some((shop) => shop.shop_id === preferredShopId)
            ? preferredShopId
            : availableShops[0]?.shop_id?.trim() ?? '',
        )
        setUsersError(null)
      } catch (error: any) {
        if (!active) return
        setShops([])
        setSelectedShopId('')
        setUsersError(error?.response?.data?.message ?? 'Unable to load your shops.')
      } finally {
        if (active) setIsLoadingShops(false)
      }
    }
    void loadShops()
    return () => {
      active = false
    }
  }, [authUser?.active_shop_id])

  const loadUsers = useCallback(async (shopId: string | null = selectedShopId || null) => {
    const requestId = ++usersRequestId.current
    if (!shopId) {
      setUsers([])
      setUsersError(null)
      setIsLoadingUsers(false)
      return
    }

    try {
      setIsLoadingUsers(true)
      setUsersError(null)
      const response = await authClient.get(`/shops/${shopId}/users`)
      if (requestId !== usersRequestId.current) return
      const rows = ((response.data?.data?.users ?? response.data?.users ?? []) as any[]).map(mapShopUserToRow)
      setUsers(rows)
      setPage(1)
    } catch (error: any) {
      if (requestId !== usersRequestId.current) return
      setUsers([])
      setUsersError(error?.response?.data?.message ?? 'Unable to load shop users.')
    } finally {
      if (requestId === usersRequestId.current) setIsLoadingUsers(false)
    }
  }, [selectedShopId])

  useEffect(() => {
    void loadUsers(selectedShopId || null)
  }, [loadUsers, selectedShopId])

  useEffect(() => {
    let active = true

    if (!selectedShopId) {
      setShopRoles([])
      setRolesError(null)
      setDraft((current) => ({ ...current, roleCode: '' }))
      return () => { active = false }
    }

    setIsLoadingRoles(true)
    setRolesError(null)
    setUsersError(null)
    authClient.get<ShopRolesResponse>(`/shops/${selectedShopId}/roles`)
      .then((response) => {
        if (!active) return
        const roles = response.data?.data?.roles ?? []
        setShopRoles(roles)
        setDraft((current) => ({
          ...current,
          roleCode: roles.some((role) => role.code === current.roleCode)
            ? current.roleCode
            : preferredCreateRoleCode(roles),
        }))
      })
      .catch((error: any) => {
        if (!active) return
        setShopRoles([])
        setRolesError(error?.response?.data?.message ?? 'Unable to load available shop roles.')
      })
      .finally(() => {
        if (active) setIsLoadingRoles(false)
      })

    return () => { active = false }
  }, [selectedShopId])

  const selectedShopUsers = useMemo(
    () => (selectedShopId ? users.filter((user) => user.shopId === selectedShopId) : []),
    [selectedShopId, users],
  )

  const filteredUsers = selectedShopUsers.filter((user) => {
    const matchesFilter = activeFilter === 'all' || user.status === activeFilter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.department.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage))
  const paginatedUsers = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const visibleColumnCount = 4 + Object.values(visibleColumns).filter(Boolean).length

  const managerOptions = selectedShopUsers.filter((user) => user.id !== editingUserId)

  const resetForm = () => {
    setDraft({ ...EMPTY_DRAFT })
    setEditingUserId(null)
    setEmailSearch('')
    setUserSuggestions([])
    setShowUserSuggestions(false)
    setSelectedRegisteredUserId(null)
    setFormOpen(false)
  }

  const openCreateForm = () => {
    setEditingUserId(null)
    setUsersError(null)
    setEmailSearch('')
    setUserSuggestions([])
    setShowUserSuggestions(false)
    setSelectedRegisteredUserId(null)
    setDraft({ ...EMPTY_DRAFT, roleCode: preferredCreateRoleCode(shopRoles) })
    setFormOpen(true)
  }

  const openEditForm = (user: SellerUserRow) => {
    setEditingUserId(user.id)
    setUsersError(null)
    setEmailSearch(user.email)
    setUserSuggestions([])
    setShowUserSuggestions(false)
    setSelectedRegisteredUserId(null)
    setDraft({
      name: user.name,
      email: user.email,
      department: user.department,
      roleCode: user.roleCode,
      status: user.status,
      reportingTo: user.reportingTo,
    })
    setFormOpen(true)
  }

  const selectRegisteredUser = (user: RegisteredUserOption) => {
    setSelectedRegisteredUserId(user.id)
    setEmailSearch(user.email)
    setShowUserSuggestions(false)
    setUserSuggestions([])
    setDraft((current) => ({
      ...current,
      name: user.name,
      email: user.email,
    }))
    setUsersError(null)
  }

  useEffect(() => {
    if (!formOpen || editingUserId || !selectedShopId) {
      return
    }

    const query = emailSearch.trim()
    if (query.length < 2) {
      setUserSuggestions([])
      setIsLookingUpUsers(false)
      return
    }

    if (selectedRegisteredUserId && query === draft.email) {
      setUserSuggestions([])
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      setIsLookingUpUsers(true)
      authClient
        .get(`/shops/${selectedShopId}/users/lookup`, { params: { search: query } })
        .then((response) => {
          if (cancelled) return
          const matches = (response.data?.data?.users ?? response.data?.users ?? []) as RegisteredUserOption[]
          setUserSuggestions(matches)
          setShowUserSuggestions(true)
        })
        .catch(() => {
          if (cancelled) return
          setUserSuggestions([])
        })
        .finally(() => {
          if (!cancelled) setIsLookingUpUsers(false)
        })
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [formOpen, editingUserId, selectedShopId, emailSearch, selectedRegisteredUserId, draft.email])

  const handleSaveUser = async () => {
    const trimmedName = draft.name.trim()
    const trimmedEmail = draft.email.trim()
    const trimmedDepartment = draft.department.trim()

    if (!editingUserId) {
      if (!selectedRegisteredUserId || !trimmedEmail || !trimmedName) {
        setUsersError('Select a registered user from the search results.')
        return
      }
    } else if (!trimmedName) {
      setUsersError('Full name is required.')
      return
    }

    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setUsersError('A valid email address is required.')
      return
    }

    if (!trimmedDepartment) {
      setUsersError('Department is required.')
      return
    }

    if (!shopRoles.some((role) => role.code === draft.roleCode)) {
      setUsersError('Select a valid role.')
      return
    }

    if (!['active', 'inactive', 'suspended'].includes(draft.status)) {
      setUsersError('Select a valid status.')
      return
    }

    if (draft.reportingTo === editingUserId) {
      setUsersError('A user cannot report to themselves.')
      return
    }

    if (!selectedShopId) {
      setUsersError('No active shop selected.')
      return
    }

    if (editingUserId) {
      try {
        const payload = {
          name: trimmedName,
          email: trimmedEmail,
          department: trimmedDepartment,
          role: draft.roleCode,
          role_code: draft.roleCode,
          status: draft.status,
          reporting_to: draft.reportingTo ?? null,
        }

        await authClient.patch(`/shops/${selectedShopId}/users/${editingUserId}`, payload)
        await loadUsers(selectedShopId)
        setUsersError(null)
        resetForm()
      } catch (error: any) {
        setUsersError(error?.response?.data?.message ?? 'Unable to update user details.')
      }
      return
    }

    try {
      await authClient.post(`/shops/${selectedShopId}/users`, {
        user_id: selectedRegisteredUserId,
        email: trimmedEmail,
        role_code: draft.roleCode,
        reporting_to: draft.reportingTo ?? null,
      })
      await loadUsers(selectedShopId)
      setUsersError(null)
      resetForm()
    } catch (error: any) {
      setUsersError(
        error?.response?.data?.message
        ?? error?.response?.data?.errors?.email?.[0]
        ?? 'Unable to assign staff. The email must belong to a registered user.',
      )
    }
  }

  const handleDeleteUser = (userId: string) => {
    setUsers((current) => current.filter((user) => user.id !== userId))
  }

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((current) => ({
      ...current,
      [column]: !current[column],
    }))
  }

  const handleExportUsers = () => {
    if (!filteredUsers.length) return

    const rows = filteredUsers.map((user) => {
      const managerName = user.reportingTo
        ? users.find((member) => member.id === user.reportingTo)?.name ?? 'Unknown manager'
        : 'No manager'

      return {
        Name: user.name,
        Email: user.email,
        Role: user.roleName,
        Department: user.department,
        'Reporting To': managerName,
        Status: user.status,
        'Last Active': user.lastActive,
      }
    })

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Shop Users')

    const fileName = `shop-users-${Date.now()}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/seller/overview" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Users</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Users</h1>
          <p className="mt-0.5 text-sm text-slate-600">Manage staff, roles, and same-shop reporting lines.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {shops.length > 1 && (
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              Shop
              <select
                aria-label="Select shop users"
                value={selectedShopId}
                disabled={isLoadingShops}
                onChange={(event) => {
                  setSelectedShopId(event.target.value)
                  setActiveFilter('all')
                  setSearch('')
                  setPage(1)
                  resetForm()
                }}
                className="h-10 min-w-48 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 disabled:opacity-60"
              >
                {shops.map((shop) => (
                  <option key={shop.shop_id} value={shop.shop_id ?? ''}>
                    {shop.shop_name || shop.shop_id}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={openCreateForm}
            disabled={!selectedShopId || isLoadingShops}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      {usersError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {usersError}
        </div>
      )}

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={resetForm}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2 text-slate-900">
                <UserCheck size={18} className="text-emerald-600" />
                <h2 className="text-base font-semibold">
                  {editingUserId ? 'Edit user' : 'Create user'}
                </h2>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-5">
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">User details</span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {!editingUserId ? (
                      <label className="relative text-sm text-slate-700 md:col-span-2">
                        <span className="mb-1.5 block font-medium">Registered user email</span>
                        <input
                          type="search"
                          value={emailSearch}
                          onChange={(e) => {
                            const value = e.target.value
                            setEmailSearch(value)
                            setSelectedRegisteredUserId(null)
                            setDraft((current) => ({ ...current, name: '', email: '' }))
                            setShowUserSuggestions(true)
                          }}
                          onFocus={() => {
                            if (userSuggestions.length > 0) setShowUserSuggestions(true)
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          placeholder="Search by registered email or name"
                          autoComplete="off"
                        />
                        {isLookingUpUsers && (
                          <span className="mt-1.5 block text-xs text-slate-500">Searching registered users...</span>
                        )}
                        {showUserSuggestions && userSuggestions.length > 0 && (
                          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                            {userSuggestions.map((user) => (
                              <li key={user.id}>
                                <button
                                  type="button"
                                  onClick={() => selectRegisteredUser(user)}
                                  className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-slate-50"
                                >
                                  <span className="text-sm font-medium text-slate-900">{user.name}</span>
                                  <span className="text-xs text-slate-500">{user.email}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </label>
                    ) : (
                      <label className="text-sm text-slate-700">
                        <span className="mb-1.5 block font-medium">Email</span>
                        <input
                          type="email"
                          value={draft.email}
                          onChange={(e) => setDraft((current) => ({ ...current, email: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          placeholder="jane@shop.com"
                        />
                      </label>
                    )}

                    <label className="text-sm text-slate-700">
                      <span className="mb-1.5 block font-medium">Full name</span>
                      <input
                        value={draft.name}
                        onChange={(e) => {
                          if (editingUserId) {
                            setDraft((current) => ({ ...current, name: e.target.value }))
                          }
                        }}
                        readOnly={!editingUserId}
                        className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${
                          editingUserId ? 'bg-white' : 'cursor-default bg-slate-100 text-slate-600'
                        }`}
                        placeholder={editingUserId ? 'Jane Doe' : 'Filled from selected user'}
                      />
                    </label>

                    <label className="text-sm text-slate-700">
                      <span className="mb-1.5 block font-medium">Department</span>
                      <input
                        value={draft.department}
                        onChange={(e) => setDraft((current) => ({ ...current, department: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        placeholder="Operations"
                      />
                    </label>

                    <label className="text-sm text-slate-700">
                      <span className="mb-1.5 block font-medium">Role</span>
                      <select
                        value={draft.roleCode}
                        onChange={(e) => setDraft((current) => ({ ...current, roleCode: e.target.value }))}
                        disabled={isLoadingRoles || shopRoles.length === 0}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      >
                        {isLoadingRoles && <option value="">Loading roles...</option>}
                        {!isLoadingRoles && shopRoles.length === 0 && <option value="">No roles available</option>}
                        {shopRoles.map((role) => (
                          <option key={role.code} value={role.code}>{role.name}</option>
                        ))}
                      </select>
                      {rolesError && <span role="alert" className="mt-1.5 block text-xs text-red-600">{rolesError}</span>}
                    </label>

                    <label className="text-sm text-slate-700 md:col-span-2">
                      <span className="mb-1.5 block font-medium">Status</span>
                      <select
                        value={draft.status}
                        onChange={(e) => setDraft((current) => ({ ...current, status: e.target.value as UserStatus }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Reporting</span>
                  </div>

                  <label className="block text-sm text-slate-700">
                    <span className="mb-1.5 block font-medium">Reporting To</span>
                    <select
                      value={draft.reportingTo ?? ''}
                      onChange={(e) => setDraft((current) => ({ ...current, reportingTo: e.target.value || null }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">No manager</option>
                      {selectedShopUsers
                        .filter((user) => user.id !== editingUserId)
                        .map((user) => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                  </label>

                  <p className="mt-2 text-xs text-slate-500">
                    Only users from this shop can be selected as a manager. Leave blank if no reporting line is assigned.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600">
              <span>
                {editingUserId
                  ? 'Assign or update the current manager for this existing user.'
                  : 'This user will be created with the selected reporting line, if any.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveUser}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  {editingUserId ? 'Save Changes' : 'Create user'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveFilter(tab.key)
              setPage(1)
            }}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              activeFilter === tab.key ? 'bg-slate-200 text-slate-900' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
          />
        </div>
        <div className="relative flex gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnMenu((value) => !value)}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Columns3 size={16} />
              Columns
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {[
                  { key: 'reportingTo', label: 'Reporting To' },
                  { key: 'status', label: 'Status' },
                  { key: 'lastActive', label: 'Last Active' },
                ].map((column) => (
                  <button
                    key={column.key}
                    type="button"
                    onClick={() => {
                      toggleColumn(column.key as keyof typeof visibleColumns)
                      setShowColumnMenu(false)
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <span>{column.label}</span>
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${visibleColumns[column.key as keyof typeof visibleColumns] ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                      ✓
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportUsers}
            className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">Name</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">Role</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">Department</span>
                </th>
                {visibleColumns.reportingTo && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1">Reporting To</span>
                  </th>
                )}
                {visibleColumns.status && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1">Status</span>
                  </th>
                )}
                {visibleColumns.lastActive && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1">Last Active</span>
                  </th>
                )}
                <th className="w-16 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => {
                const managerName = user.reportingTo
                  ? users.find((member) => member.id === user.reportingTo)?.name
                  : null

                return (
                  <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700">
                          {user.initials}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[user.role]}`}>
                        {user.roleName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{user.department}</td>
                    {visibleColumns.reportingTo && (
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {managerName ? (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {managerName}
                          </span>
                        ) : (
                          <span className="text-slate-400">No manager</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[user.status]}`}>
                          {user.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.lastActive && (
                      <td className="px-4 py-3 text-xs text-slate-600">{user.lastActive}</td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-500">
                        <button type="button" className="hover:text-slate-700" aria-label="Edit user" onClick={() => openEditForm(user)}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="hover:text-red-600" aria-label="Delete user" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={visibleColumnCount} className="px-4 py-8 text-center text-sm text-slate-500">
                    {isLoadingShops || isLoadingUsers
                      ? 'Loading shop users…'
                      : !selectedShopId
                        ? 'No active shop membership is available.'
                        : filteredUsers.length === 0 && (search || activeFilter !== 'all')
                          ? 'No users match the current filters.'
                          : `No users are assigned to ${shops.find((shop) => shop.shop_id === selectedShopId)?.shop_name ?? 'this shop'}.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DataTablePagination
          page={page}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={filteredUsers.length}
          rowsPerPageOptions={[10, 20, 25]}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setPage(1)
          }}
        />
      </div>
    </div>
  )
}

export default SellerUsersPage