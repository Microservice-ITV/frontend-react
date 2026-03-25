import { useState } from 'react'
import { Link } from 'react-router-dom'
import DataTablePagination from '@/components/ui/DataTablePagination'
import type { UserRole, UserRow, UserStatus } from '../types/userTypes'
import {
  Plus,
  Search,
  Columns3,
  Download,
  Pencil,
  Trash2,
} from 'lucide-react'

const MOCK_USERS: UserRow[] = [
  { id: 'u1', name: 'Aigars Silkans', email: 'aigars@company.com', initials: 'AS', role: 'admin', department: 'Engineering', status: 'active', lastActive: '2 hours ago' },
  { id: 'u2', name: 'Emma Wilson', email: 'emma@company.com', initials: 'EW', role: 'editor', department: 'Marketing', status: 'active', lastActive: '5 min ago' },
  { id: 'u3', name: 'James Chen', email: 'james@company.com', initials: 'JC', role: 'admin', department: 'Engineering', status: 'active', lastActive: '1 hour ago' },
  { id: 'u4', name: 'Sofia Garcia', email: 'sofia@company.com', initials: 'SG', role: 'moderator', department: 'Support', status: 'active', lastActive: '30 min ago' },
  { id: 'u5', name: 'Alex Thompson', email: 'alex@company.com', initials: 'AT', role: 'viewer', department: 'Sales', status: 'active', lastActive: '3 hours ago' },
  { id: 'u6', name: 'Maria Santos', email: 'maria@company.com', initials: 'MS', role: 'editor', department: 'Design', status: 'active', lastActive: '1 day ago' },
  { id: 'u7', name: 'David Kim', email: 'david@company.com', initials: 'DK', role: 'viewer', department: 'Finance', status: 'inactive', lastActive: '2 weeks ago' },
  { id: 'u8', name: 'Lisa Park', email: 'lisa@company.com', initials: 'LP', role: 'editor', department: 'Marketing', status: 'active', lastActive: '10 min ago' },
  { id: 'u9', name: 'Ryan Mitchell', email: 'ryan@company.com', initials: 'RM', role: 'moderator', department: 'Support', status: 'active', lastActive: '45 min ago' },
  { id: 'u10', name: 'Nina Patel', email: 'nina@company.com', initials: 'NP', role: 'admin', department: 'Engineering', status: 'active', lastActive: '15 min ago' },
  { id: 'u11', name: 'Oliver Scott', email: 'oliver@company.com', initials: 'OS', role: 'viewer', department: 'Operations', status: 'suspended', lastActive: '3 days ago' },
  { id: 'u12', name: 'Ava Reed', email: 'ava@company.com', initials: 'AR', role: 'editor', department: 'Design', status: 'active', lastActive: '9 min ago' },
]

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

const SellerUsersPage = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | UserStatus>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const filteredUsers = MOCK_USERS.filter((user) => {
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
          <p className="mt-0.5 text-sm text-slate-600">Manage team members, roles, and permissions.</p>
        </div>
        <Link
          to="/seller/users"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          Add User
        </Link>
      </div>

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
        <div className="flex gap-2">
          <button type="button" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer">
            <Columns3 size={16} />
            Columns
          </button>
          <button type="button" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
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
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">Status</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">Last Active</span>
                </th>
                <th className="w-16 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
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
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">{user.department}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{user.lastActive}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <button type="button" className="hover:text-slate-700" aria-label="Edit user">
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="hover:text-red-600" aria-label="Delete user">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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