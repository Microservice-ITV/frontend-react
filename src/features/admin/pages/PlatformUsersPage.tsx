import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Network, RefreshCw, Save, Users } from 'lucide-react'
import { adminUsersApi, type PlatformUserDto } from '../api/adminUsersApi'

const errorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown; error?: unknown } } }).response
    if (typeof response?.data?.message === 'string') return response.data.message
    if (typeof response?.data?.error === 'string') return response.data.error
  }
  return error instanceof Error ? error.message : 'Unable to load platform users.'
}

const PlatformUsersPage = () => {
  const [users, setUsers] = useState<PlatformUserDto[]>([])
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = async () => {
    setStatus('loading')
    setError(null)
    try {
      const response = await adminUsersApi.listPlatformUsers()
      const rows = response.data.data.users ?? []
      setUsers(rows)
      setSelections(Object.fromEntries(rows.map((user) => [user.id, user.reporting_to ?? ''])))
      setStatus('ready')
    } catch (cause) {
      setStatus('failed')
      setError(errorMessage(cause))
    }
  }

  useEffect(() => { void load() }, [])

  const activeUsers = useMemo(() => users.filter((user) => user.status === 'active'), [users])

  const isCfo = (user: PlatformUserDto) => user.role?.code === 'platform_cfo'

  const save = async (user: PlatformUserDto) => {
    setSavingId(user.id)
    setError(null)
    setNotice(null)
    try {
      await adminUsersApi.updatePlatformReportingTo(user.id, selections[user.id] || null)
      setNotice(`Reporting line updated for ${user.user?.name ?? user.user_id}.`)
      await load()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Platform Users</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Network size={22} className="text-indigo-600" />Platform reporting lines</h1>
          <p className="mt-1 text-sm text-slate-600">Assign the manager chain used by platform expense approvals.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={status === 'loading'} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={15} className={status === 'loading' ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3"><p className="text-xs text-indigo-700">Active platform users</p><p className="mt-1 text-xl font-bold text-indigo-950">{activeUsers.length}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs text-slate-500">Managers assigned</p><p className="mt-1 text-xl font-bold text-slate-900">{activeUsers.filter((user) => user.reporting_to).length}</p></div>
        <div className="hidden rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 sm:block"><p className="text-xs text-amber-700">Top-level users</p><p className="mt-1 text-xl font-bold text-amber-950">{activeUsers.filter((user) => !user.reporting_to).length}</p></div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-4"><h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Users size={16} className="text-slate-500" />Platform team</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead><tr className="border-b border-slate-200 bg-slate-50"><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">User</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Role</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Reports to</th><th className="w-28 px-4 py-3 text-left text-xs font-medium text-slate-600">Action</th></tr></thead>
            <tbody>
              {status === 'loading' && <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">Loading platform users...</td></tr>}
              {status === 'ready' && activeUsers.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">No platform users have been assigned yet.</td></tr>}
              {status === 'ready' && activeUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3"><p className="text-sm font-semibold text-slate-900">{user.user?.name ?? user.user_id}</p><p className="text-xs text-slate-500">{user.user?.email ?? 'User ID unavailable'}</p></td>
                  <td className="px-4 py-3"><span className="rounded-full bg-indigo-100 px-2 py-1 text-[11px] font-medium text-indigo-700">{user.role?.name ?? user.role?.code ?? 'Platform role'}</span></td>
                  <td className="px-4 py-3"><select value={selections[user.id] ?? ''} disabled={isCfo(user)} onChange={(event) => setSelections((current) => ({ ...current, [user.id]: event.target.value }))} aria-label={`${user.user?.name ?? user.user_id} reports to`} className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"><option value="">{isCfo(user) ? 'Top-level approver' : 'No manager'}</option>{!isCfo(user) && activeUsers.filter((candidate) => candidate.id !== user.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.user?.name ?? candidate.user_id} · {candidate.role?.name ?? candidate.role?.code}</option>)}</select></td>
                  <td className="px-4 py-3"><button type="button" onClick={() => void save(user)} disabled={savingId === user.id} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"><Save size={13} />{savingId === user.id ? 'Saving...' : 'Save'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default PlatformUsersPage
