import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, BookOpen, Plus, ReceiptText, Scale } from 'lucide-react'
import AccountingStatusBadge from '../components/AccountingStatusBadge'
import { accountingExpensesAdapter } from '../adapters/accountingExpensesAdapter'
import type { AccountingExpense, AccountingJournalEntry } from '../types/expenseTypes'

const STATUS_KEYS = ['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'RETURNED', 'APPROVED', 'REJECTED', 'CANCELLED'] as const
const money = (value: number, currency = 'MMK') => `${currency} ${value.toLocaleString()}`
const errorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: unknown } } }).response
    if (typeof response?.data?.error === 'string') return response.data.error
  }
  return error instanceof Error && error.message ? error.message : 'Unable to load accounting overview.'
}
const formatDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const SellerAccountingOverviewPage = () => {
  const [expenses, setExpenses] = useState<AccountingExpense[]>([])
  const [entries, setEntries] = useState<AccountingJournalEntry[]>([])
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void Promise.all([accountingExpensesAdapter.list(), accountingExpensesAdapter.listJournalEntries()])
      .then(([loadedExpenses, loadedEntries]) => {
        if (!active) return
        setExpenses(loadedExpenses)
        setEntries(loadedEntries.slice(0, 5))
        setStatus('succeeded')
      })
      .catch((cause) => {
        if (!active) return
        setStatus('failed')
        setError(errorMessage(cause))
      })
    return () => { active = false }
  }, [])

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const approvedExpenses = expenses.filter((expense) => expense.status === 'APPROVED').length
  const pendingExpenses = expenses.filter((expense) => expense.status === 'PENDING_APPROVAL').length
  const statusCounts = STATUS_KEYS.map((key) => ({ key, count: expenses.filter((expense) => expense.status === key).length }))

  return (
    <section className="space-y-6">
      <nav className="text-xs text-slate-500"><Link to="/seller/overview" className="hover:text-slate-700">Dashboard</Link><span className="mx-1">/</span><span className="text-slate-900">Accounting</span></nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Scale size={22} className="text-emerald-600" />Accounting Overview</h1><p className="mt-0.5 text-sm text-slate-600">Shop income, expense, and ledger activity from accounting-service.</p></div><div className="flex flex-wrap gap-2"><Link to="/seller/accounting/income" className="inline-flex items-center gap-2 self-start rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"><CircleDollarSign size={16} />Income</Link><Link to="/seller/accounting/expenses/new" className="inline-flex items-center gap-2 self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"><Plus size={16} />Add Expense</Link></div></div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><SummaryCard label="Recorded expenses" value={expenses.length.toLocaleString()} icon={ReceiptText} tone="bg-orange-50 text-orange-600" /><SummaryCard label="Expense total" value={status === 'loading' ? '...' : money(totalExpenses)} icon={ArrowDownRight} tone="bg-red-50 text-red-600" /><SummaryCard label="Pending approval" value={pendingExpenses.toLocaleString()} icon={BookOpen} tone="bg-amber-50 text-amber-600" /><SummaryCard label="Approved expenses" value={approvedExpenses.toLocaleString()} icon={ArrowUpRight} tone="bg-emerald-50 text-emerald-600" /></div>
      <div className="grid gap-6 xl:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"><div className="flex items-center justify-between"><h2 className="text-base font-bold text-slate-900">Expense status</h2><Link to="/seller/accounting/expenses" className="text-xs font-medium text-emerald-700">View expenses</Link></div>{expenses.length === 0 ? <p className="mt-5 text-sm text-slate-500">No expense records were returned.</p> : <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{statusCounts.filter((item) => item.count > 0).map((item) => <div key={item.key} className="rounded-lg bg-slate-50 p-3"><AccountingStatusBadge status={item.key} /><p className="mt-1 text-lg font-bold text-slate-900">{item.count}</p></div>)}</div>}</div><div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"><div className="flex items-center justify-between"><h2 className="text-base font-bold text-slate-900">Recent journal entries</h2><Link to="/seller/accounting/journal-entries" className="text-xs font-medium text-emerald-700">View all</Link></div>{entries.length === 0 ? <p className="mt-5 text-sm text-slate-500">No journal entries were returned.</p> : <div className="mt-4 divide-y divide-slate-100">{entries.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-900">{entry.referenceId}</p><p className="mt-1 truncate text-xs text-slate-500">{entry.narration ?? 'Journal entry'} · {formatDate(entry.entryDate)}</p></div><AccountingStatusBadge status={entry.status} /></div>)}</div>}</div></div>
    </section>
  )
}

const SummaryCard = ({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof ReceiptText; tone: string }) => <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-500">{label}</p><span className={`rounded-lg p-2 ${tone}`}><Icon size={16} /></span></div><p className="mt-2 text-xl font-bold text-slate-900">{value}</p></div>

export default SellerAccountingOverviewPage
