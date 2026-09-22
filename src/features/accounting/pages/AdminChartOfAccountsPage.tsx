import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, ChevronDown, ChevronRight, Filter, MoreHorizontal, Pencil, Plus, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import AccountDefinitionForm from '../components/AccountDefinitionForm'
import { accountingAccountsAdapter } from '../adapters/accountingAccountsAdapter'
import { ACCOUNT_TYPES, type AccountDefinitionDraft, type AccountType, type AccountingAccountDefinition } from '../types/accountTypes'

const TYPE_LABELS: Record<AccountType, string> = { ASSET: 'Asset', LIABILITY: 'Liability', EQUITY: 'Equity', REVENUE: 'Revenue', EXPENSE: 'Expense' }
const inputClassName = 'w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-500'

const emptyDraft = (): AccountDefinitionDraft => ({ code: '', name: '', type: 'ASSET', parentCode: null, description: '', status: 'ACTIVE' })
const toDraft = (account: AccountingAccountDefinition): AccountDefinitionDraft => ({ code: account.code, name: account.name, type: account.type, parentCode: account.parentCode, description: account.description, status: account.status })

const AccountStatusBadge = ({ status }: { status: AccountingAccountDefinition['status'] }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
    {status === 'ACTIVE' ? 'Active' : 'Inactive'}
  </span>
)

const AdminChartOfAccountsPage = () => {
  const { openModal } = useGlobalModal()
  const [accounts, setAccounts] = useState<AccountingAccountDefinition[]>([])
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<AccountType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<AccountingAccountDefinition['status'] | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const draftRef = useRef<AccountDefinitionDraft>(emptyDraft())

  const loadAccounts = async () => {
    setStatus('loading')
    setError(null)
    try {
      setAccounts(await accountingAccountsAdapter.list())
      setStatus('succeeded')
    } catch {
      setStatus('failed')
      setError('Unable to load chart of accounts.')
    }
  }

  useEffect(() => { void loadAccounts() }, [])

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return accounts.filter((account) => {
      const parent = accounts.find((candidate) => candidate.code === account.parentCode)
      const matchesSearch = !query || [account.code, account.name, account.description, parent?.name ?? ''].some((value) => value.toLowerCase().includes(query))
      return matchesSearch && (typeFilter === 'ALL' || account.type === typeFilter) && (statusFilter === 'ALL' || account.status === statusFilter)
    })
  }, [accounts, search, statusFilter, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / rowsPerPage))
  const visibleAccounts = filteredAccounts.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const openAccountModal = (account?: AccountingAccountDefinition) => {
    const initialValue = account ? toDraft(account) : emptyDraft()
    draftRef.current = initialValue
    openModal({
      title: account ? `Edit account · ${account.name}` : 'Add account',
      content: <AccountDefinitionForm initialValue={initialValue} accounts={accounts} editingId={account?.id} onChange={(next) => { draftRef.current = next }} />,
      primaryLabel: account ? 'Save changes' : 'Create account',
      primaryVariant: 'success',
      onPrimary: async () => {
        const draft = draftRef.current
        if (!draft.code.trim()) throw new Error('Account code is required.')
        if (!draft.name.trim()) throw new Error('Account name is required.')
        if (!ACCOUNT_TYPES.includes(draft.type)) throw new Error('Select a valid account type.')
        const duplicate = accounts.some((item) => item.code.toLowerCase() === draft.code.trim().toLowerCase() && item.id !== account?.id)
        if (duplicate) throw new Error('Account code must be unique.')
        if (account) await accountingAccountsAdapter.update(account.code, { ...draft, code: draft.code.trim(), name: draft.name.trim() })
        else await accountingAccountsAdapter.create({ ...draft, code: draft.code.trim(), name: draft.name.trim() })
        await loadAccounts()
      },
    })
  }

  const toggleAccountStatus = async (account: AccountingAccountDefinition) => {
    try {
      await accountingAccountsAdapter.toggleStatus(account.code)
      await loadAccounts()
    } catch {
      setError('Unable to update account status.')
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500"><Link to="/super-admin/overview" className="hover:text-slate-700">Dashboard</Link><span className="mx-1">/</span><Link to="/super-admin/accounting/overview" className="hover:text-slate-700">Accounting</Link><span className="mx-1">/</span><span className="text-slate-900">Chart of Accounts</span></nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Calculator size={22} className="text-emerald-600" />Chart of Accounts</h1><p className="mt-0.5 text-sm text-slate-600">Manage the accounts used to record and classify accounting transactions.</p></div>
        <button type="button" onClick={() => openAccountModal()} className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 cursor-pointer"><Plus size={16} />Add Account</button>
      </div>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search accounts..." className={inputClassName} /></div><div className="flex flex-wrap items-center gap-2"><Filter size={15} className="text-slate-400" /><select aria-label="Filter by account type" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value as AccountType | 'ALL'); setPage(1) }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"><option value="ALL">All types</option>{ACCOUNT_TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type]}</option>)}</select><select aria-label="Filter by account status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as AccountingAccountDefinition['status'] | 'ALL'); setPage(1) }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div></div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[900px]"><thead><tr className="border-b border-slate-200 bg-slate-50"><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Account Code</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Account Name</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Account Type</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Parent Account</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Normal Balance</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Status</th><th className="w-24 px-4 py-3 text-left text-xs font-medium text-slate-600">Actions</th></tr></thead><tbody>{status === 'loading' && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">Loading chart of accounts...</td></tr>}{status === 'failed' && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-red-600">{error}</td></tr>}{status === 'succeeded' && visibleAccounts.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">No accounts found for the current filters.</td></tr>}{status === 'succeeded' && visibleAccounts.map((account) => { const parent = accounts.find((candidate) => candidate.code === account.parentCode); const hasChildren = accounts.some((candidate) => candidate.parentCode === account.code); return <tr key={account.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50"><td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">{account.code}</td><td className="px-4 py-3"><div className="flex items-center gap-1" style={{ paddingLeft: account.parentCode ? 20 : 0 }}>{account.parentCode ? <ChevronRight size={14} className="shrink-0 text-slate-400" /> : hasChildren ? <ChevronDown size={14} className="shrink-0 text-slate-400" /> : null}<span className={account.parentCode ? 'text-xs text-slate-700' : 'text-xs font-semibold text-slate-900'}>{account.name}</span></div>{account.description && <p className="mt-0.5 max-w-xs truncate text-[11px] text-slate-400" style={{ marginLeft: account.parentCode ? 40 : 0 }}>{account.description}</p>}</td><td className="px-4 py-3 text-xs text-slate-600">{TYPE_LABELS[account.type]}</td><td className="px-4 py-3 text-xs text-slate-600">{parent ? `${parent.code} · ${parent.name}` : '—'}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-medium ${account.normalBalance === 'DEBIT' ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'}`}>{account.normalBalance === 'DEBIT' ? 'Debit' : 'Credit'}</span></td><td className="px-4 py-3"><AccountStatusBadge status={account.status} /></td><td className="px-4 py-3"><div className="flex items-center gap-1"><button type="button" onClick={() => openAccountModal(account)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer" aria-label={`Edit ${account.name}`}><Pencil size={15} /></button><button type="button" onClick={() => void toggleAccountStatus(account)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer" aria-label={`${account.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} ${account.name}`}>{account.status === 'ACTIVE' ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}</button><MoreHorizontal size={16} className="text-slate-300" aria-hidden="true" /></div></td></tr> })}</tbody></table></div><DataTablePagination page={page} totalPages={totalPages} rowsPerPage={rowsPerPage} totalItems={filteredAccounts.length} itemLabel="accounts" onPageChange={setPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(1) }} /></div>
      <p className="text-xs text-slate-500">Normal balances are derived from accounting rules: assets and expenses debit; liabilities, equity, and revenue credit.</p>
    </div>
  )
}

export default AdminChartOfAccountsPage