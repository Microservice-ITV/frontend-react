import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import { Shield, Search, KeyRound, Pencil, ChevronDown, ChevronRight } from 'lucide-react'
import type { RbacPermissionDto } from '../api/adminRbacApi'
import {
  selectAdminRbacRoles,
  selectAdminRbacStatus,
  selectAdminRbacError,
  selectAdminRbacPermissions,
  selectAdminRbacPermissionsStatus,
} from '../store/adminRbacSelectors'
import {
  fetchAdminRbacRoles,
  fetchAdminRbacPermissions,
  updateAdminRbacRolePermissions,
} from '../store/adminRbacThunks'
import type { RbacRoleRow, RbacScope } from '../types/rbacTypes'

const SCOPE_LABELS: Record<string, string> = {
  platform: 'Platform',
  shop: 'Shop',
  self: 'Self',
}

const scopeLabel = (scope: RbacRoleRow['scope']) => SCOPE_LABELS[scope] ?? scope

const AdminRbacPage = () => {
  const dispatch = useAppDispatch()
  const { openModal } = useGlobalModal()
  const roles = useAppSelector(selectAdminRbacRoles)
  const status = useAppSelector(selectAdminRbacStatus)
  const error = useAppSelector(selectAdminRbacError)
  const permissions = useAppSelector(selectAdminRbacPermissions)
  const permissionsStatus = useAppSelector(selectAdminRbacPermissionsStatus)
  const [activeScope, setActiveScope] = useState<RbacScope | 'all'>('all')
  const [search, setSearch] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const selectionRef = useRef<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchAdminRbacRoles())
    }
  }, [dispatch, status])

  useEffect(() => {
    if (permissionsStatus === 'idle') {
      dispatch(fetchAdminRbacPermissions())
    }
  }, [dispatch, permissionsStatus])

  const handleManagePermissions = (role: RbacRoleRow) => {
    selectionRef.current = new Set(role.permissionCodes)
    openModal({
      title: `Manage permissions · ${role.name}`,
      content: (
        <PermissionEditor
          role={role}
          permissions={permissions}
          permissionsStatus={permissionsStatus}
          onSelectionChange={(next) => {
            selectionRef.current = next
          }}
        />
      ),
      primaryLabel: 'Save changes',
      primaryVariant: 'success',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        await dispatch(
          updateAdminRbacRolePermissions({
            roleId: role.id,
            permissionCodes: Array.from(selectionRef.current),
          }),
        ).unwrap()
      },
    })
  }

  const scopeTabs = useMemo(() => {
    const scopes = Array.from(new Set(roles.map((role) => role.scope))).sort((a, b) =>
      a.localeCompare(b),
    )
    return [{ key: 'all' as const, label: 'All' }, ...scopes.map((scope) => ({
      key: scope as RbacScope,
      label: `${scopeLabel(scope)} (${roles.filter((role) => role.scope === scope).length})`,
    }))]
  }, [roles])

  const totalPermissions = useMemo(
    () => roles.reduce((sum, role) => sum + role.permissionCount, 0),
    [roles],
  )

  const filteredRoles = roles.filter((role) => {
    const matchesScope = activeScope === 'all' || role.scope === activeScope

    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      role.name.toLowerCase().includes(query) ||
      role.code.toLowerCase().includes(query) ||
      role.permissionGroups.some((group) =>
        group.actions.some(
          (action) =>
            `${group.module}.${action}`.toLowerCase().includes(query) ||
            group.module.toLowerCase().includes(query),
        ),
      )

    return matchesScope && matchesSearch
  })

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">RBAC</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Shield size={22} className="text-slate-400" />
            Role-based Access Control
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Roles and their permissions are loaded live from auth-service. {roles.length} roles,
            {totalPermissions} permissions across {scopeTabs.length - 1} scopes. Use <strong>Edit</strong>{' '}
            to change the permission set for any role.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {scopeTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveScope(tab.key)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
              activeScope === tab.key
                ? 'bg-slate-200 text-slate-900'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative w-full max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search roles or permissions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-10 px-2 py-3" aria-label="Expand" />
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">Role</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">Scope</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">Permissions</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">Created</span>
                </th>
                <th className="w-24 px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {status === 'loading' && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    Loading roles from auth-service...
                  </td>
                </tr>
              )}
              {status === 'failed' && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-red-600">
                    {error ?? 'Unable to load roles.'}
                  </td>
                </tr>
              )}
              {status !== 'loading' && status !== 'failed' && filteredRoles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No roles found for the current filter.
                  </td>
                </tr>
              )}
              {status !== 'loading' && status !== 'failed' && filteredRoles.map((role) => {
                const isExpanded = expandedRows.has(role.id)
                return (
                  <Fragment key={role.id}>
                    <tr className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50">
                      <td className="px-2 py-4 text-center">
                        <button
                          type="button"
                          aria-label={isExpanded ? `Collapse ${role.name}` : `Expand ${role.name}`}
                          aria-expanded={isExpanded}
                          onClick={() => toggleRow(role.id)}
                          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <RoleCell role={role} />
                      </td>
                      <td className="px-4 py-4">
                        <ScopeBadge scope={role.scope} />
                      </td>
                      <td className="px-4 py-4">
                        <PermissionGroups groups={role.permissionGroups} count={role.permissionCount} />
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">{role.created}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => handleManagePermissions(role)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 cursor-pointer"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <td colSpan={6} className="px-4 py-4 pl-12 sm:px-6">
                          <PermissionGroupsDetail
                            groups={role.permissionGroups}
                            count={role.permissionCount}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const RoleCell = ({ role }: { role: RbacRoleRow }) => (
  <div className="flex items-center gap-3">
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded ${
        role.isSystem ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
      }`}
    >
      <KeyRound size={20} />
    </div>
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold text-slate-900">
        {role.name}
        {role.isSystem && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            System
          </span>
        )}
      </p>
      <p className="mt-0.5 font-mono text-[11px] text-slate-500">{role.code}</p>
    </div>
  </div>
)

const ScopeBadge = ({ scope }: { scope: RbacRoleRow['scope'] }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
      scope === 'platform'
        ? 'bg-indigo-100 text-indigo-700'
        : scope === 'shop'
          ? 'bg-emerald-100 text-emerald-700'
          : scope === 'self'
            ? 'bg-amber-100 text-amber-800'
            : 'bg-slate-100 text-slate-600'
    }`}
  >
    {scopeLabel(scope)}
  </span>
)

const PermissionGroups = ({
  groups,
  count,
}: {
  groups: RbacRoleRow['permissionGroups']
  count: number
}) => {
  if (groups.length === 0) {
    return <span className="text-xs text-slate-400">No permissions</span>
  }

  return (
    <div className="space-y-1.5">
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        {count} permission{count === 1 ? '' : 's'}
      </span>
      <div className="flex flex-wrap gap-1">
        {groups.slice(0, 3).map((group) => (
          <span
            key={group.module}
            className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
          >
            {group.module} · {group.actions.length}
          </span>
        ))}
        {groups.length > 3 && (
          <span className="px-1 py-0.5 font-mono text-[10px] text-slate-400">
            +{groups.length - 3} more
          </span>
        )}
      </div>
    </div>
  )
}

const PermissionGroupsDetail = ({
  groups,
  count,
}: {
  groups: RbacRoleRow['permissionGroups']
  count: number
}) => {
  if (groups.length === 0) {
    return <span className="text-xs text-slate-400">No permissions</span>
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-600">
          {count} permission{count === 1 ? '' : 's'} across {groups.length} module
          {groups.length === 1 ? '' : 's'}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <div key={group.module} className="rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-white">
                {group.module}
              </span>
              <span className="text-[10px] text-slate-400">{group.actions.length}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {group.actions.map((action) => (
                <span
                  key={action}
                  className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-700"
                >
                  {action}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type PermissionGroupWithItems = {
  module: string
  items: RbacPermissionDto[]
}

const buildPermissionGroups = (permissions: RbacPermissionDto[]): PermissionGroupWithItems[] => {
  const byModule = new Map<string, RbacPermissionDto[]>()
  for (const permission of permissions) {
    const module = permission.module?.trim() || permission.code.split('.')[0] || 'misc'
    const items = byModule.get(module) ?? []
    items.push(permission)
    byModule.set(module, items)
  }
  return Array.from(byModule.entries())
    .map(([module, items]) => ({
      module,
      items: items.sort((a, b) => a.action.localeCompare(b.action)),
    }))
    .sort((a, b) => a.module.localeCompare(b.module))
}

const PermissionEditor = ({
  role,
  permissions,
  permissionsStatus,
  onSelectionChange,
}: {
  role: RbacRoleRow
  permissions: RbacPermissionDto[]
  permissionsStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  onSelectionChange: (selected: Set<string>) => void
}) => {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(role.permissionCodes))
  const groups = useMemo(() => buildPermissionGroups(permissions), [permissions])

  useEffect(() => {
    onSelectionChange(selected)
  }, [selected, onSelectionChange])

  const togglePermission = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const toggleModule = (module: string, codes: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev)
      const allSelected = codes.every((code) => next.has(code))
      for (const code of codes) {
        if (allSelected) next.delete(code)
        else next.add(code)
      }
      return next
    })
  }

  if (permissionsStatus !== 'succeeded' || groups.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {permissionsStatus === 'loading' || permissionsStatus === 'idle'
          ? 'Loading available permissions from auth-service...'
          : 'Unable to load available permissions. Close and try again.'}
      </p>
    )
  }

  return (
    <div>
      <p className="mb-4 text-xs text-slate-500">
        Tick the permissions this role should have. Permissions are grouped by module and loaded
        dynamically from auth-service. This updates every user currently holding{' '}
        <span className="font-medium text-slate-700">{role.name}</span>.
      </p>

      <div className="space-y-4">
        {groups.map((group) => {
          const moduleCodes = group.items.map((item) => item.code)
          const selectedCount = moduleCodes.filter((code) => selected.has(code)).length
          const allSelected = selectedCount === moduleCodes.length

          return (
            <div key={group.module} className="rounded-lg border border-slate-200">
              <div className="flex items-center justify-between rounded-t-lg bg-slate-50 px-3 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => toggleModule(group.module, moduleCodes)}
                    className="rounded border-slate-300"
                  />
                  {group.module}
                </label>
                <span className="text-[11px] text-slate-500">
                  {selectedCount}/{moduleCodes.length}
                </span>
              </div>
              <div className="grid gap-1 p-2 sm:grid-cols-2">
                {group.items.map((item) => {
                  const checked = selected.has(item.code)
                  return (
                    <label
                      key={item.code}
                      className={`flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-xs ${
                        checked ? 'bg-emerald-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermission(item.code)}
                        className="mt-0.5 rounded border-slate-300"
                      />
                      <span>
                        <span className="block font-mono font-medium text-slate-800">
                          {item.action}
                        </span>
                        <span className="block font-mono text-[10px] text-slate-400">
                          {item.code}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AdminRbacPage