import { useEffect, useState } from 'react'
import { adminUsersApi, type AdminUserDto } from '@/features/admin/api/adminUsersApi'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'

const WAREHOUSE_MANAGER_ROLE = 'warehouse_manager'
const VISIBLE_ROLE_CODES = new Set(['user', WAREHOUSE_MANAGER_ROLE])

/** Already assigned, or new register (user only) — exclude sellers and other roles. */
const isAssignableCandidate = (user: AdminUserDto) => {
  if (user.roles.some((role) => role.code === WAREHOUSE_MANAGER_ROLE)) return true
  if (user.has_shop_membership) return false
  return user.roles.length > 0 && user.roles.every((role) => VISIBLE_ROLE_CODES.has(role.code))
}

const AssignWarehouseManagerPage = () => {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<AdminUserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await adminUsersApi.listUsers({
          search: query,
          per_page: 100,
          page: 1,
        })
        if (!cancelled) {
          setUsers((response.data?.data?.users ?? []).filter(isAssignableCandidate))
        }
      } catch (err) {
        if (!cancelled) {
          setUsers([])
          setError(adminUsersApi.getApiErrorMessage(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [query])

  const assign = async (user: AdminUserDto) => {
    setAssigningId(user.id)
    setNotice(null)
    setError(null)
    try {
      await adminUsersApi.assignPlatformRole(user.id, WAREHOUSE_MANAGER_ROLE)
      setUsers((current) =>
        current.map((row) =>
          row.id === user.id
            ? {
                ...row,
                roles: row.roles.some((role) => role.code === WAREHOUSE_MANAGER_ROLE)
                  ? row.roles
                  : [
                      ...row.roles,
                      {
                        id: WAREHOUSE_MANAGER_ROLE,
                        code: WAREHOUSE_MANAGER_ROLE,
                        name: 'Warehouse Manager',
                        scope: 'platform',
                      },
                    ],
              }
            : row,
        ),
      )
      setNotice(
        `${user.name} is now a warehouse manager. They will see the warehouse dashboard the next time they log in.`,
      )
    } catch (err) {
      setError(adminUsersApi.getApiErrorMessage(err))
    } finally {
      setAssigningId(null)
    }
  }

  const columns: Array<DataTableColumn<AdminUserDto>> = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => <span className="font-medium text-slate-800">{row.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => <span className="text-sm text-slate-600">{row.email}</span>,
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.roles.length > 0 ? row.roles.map((role) => role.name).join(', ') : '—'}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      width: '180px',
      render: (row) => {
        const assigned = row.roles.some((role) => role.code === WAREHOUSE_MANAGER_ROLE)
        return (
          <button
            type="button"
            disabled={assigned || assigningId === row.id}
            onClick={() => void assign(row)}
            className="inline-flex cursor-pointer items-center rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-default disabled:bg-slate-200 disabled:text-slate-500"
          >
            {assigned ? 'Assigned' : assigningId === row.id ? 'Assigning…' : 'Assign'}
          </button>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Assign Warehouse Manager</h1>
        <p className="text-sm text-slate-500">
          Choose a registered user. After they log in again, their dashboard shows only the warehouse menus.
        </p>
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search name or email…',
        }}
      />

      <DataTable<AdminUserDto>
        columns={columns}
        rows={users}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No registered users match this search."
        itemLabel="users"
        minWidth="720px"
      />
    </div>
  )
}

export default AssignWarehouseManagerPage
