import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReceiptText, RefreshCw, Search, Plus } from 'lucide-react'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { accountingAccountsAdapter } from '@/features/accounting/adapters/accountingAccountsAdapter'
import type { AccountingAccountDefinition } from '@/features/accounting/types/accountTypes'
import { accountingClient } from '@/lib/api/accountingClient'
import { adminAccountingApi, type AccountingIncomeLine, type CreateExpensePayload, type ExpenseCategory } from '../api/adminAccountingApi'

type ExpenseRow = {
  id: string
  dateValue: string
  date: string
  reference: string
  expenseAccount: string
  fundingAccount: string
  category: string
  description: string
  status: string
  amount: number
}

type ExpenseJournalEntry = {
  id: string
  referenceId: string
  narration: string | null
  entryDate: string
  status: string
  lines: Array<AccountingIncomeLine & { direction: 'DEBIT' | 'CREDIT' }>
}

const formatDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const toExpenseRows = (entries: ExpenseJournalEntry[], categories: ExpenseCategory[]): ExpenseRow[] =>
  entries
    .map((entry) => {
      const debitLine = entry.lines.find((line) => line.direction === 'DEBIT' && line.account.type === 'EXPENSE')
      if (!debitLine) return null

      const creditLine = entry.lines.find((line) => line.direction === 'CREDIT')
      const category = categories.find((item) => item.name === debitLine.memo || item.code === debitLine.memo)
      const categoryName = category?.name ?? debitLine.memo ?? 'Uncategorized'
      const categoryPrefix = `${categoryName} - `
      const description = entry.narration?.startsWith(categoryPrefix)
        ? entry.narration.slice(categoryPrefix.length)
        : entry.narration ?? '—'

      return {
        id: debitLine.id,
        dateValue: entry.entryDate.slice(0, 10),
        date: formatDate(entry.entryDate),
        reference: entry.referenceId,
        category: categoryName,
        expenseAccount: `${debitLine.account.code} · ${debitLine.account.name}`,
        fundingAccount: creditLine ? `${creditLine.account.code} · ${creditLine.account.name}` : '—',
        description: description || '—',
        status: entry.status,
        amount: Number(debitLine.amount),
      }
    })
    .filter((row): row is ExpenseRow => row !== null)

const AdminExpensePage = () => {
  const [entries, setEntries] = useState<ExpenseRow[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [accounts, setAccounts] = useState<AccountingAccountDefinition[]>([])
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([])
  const [accountsError, setAccountsError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [form, setForm] = useState<CreateExpensePayload>({
    amount: 0,
    expenseDate: new Date().toISOString().slice(0, 10),
    expenseAccountCode: '',
    fundingAccountCode: '',
    expenseCategoryId: '',
    description: '',
  })

  const loadExpenses = async () => {
    setStatus('loading')
    setError(null)
    try {
      const response = await accountingClient.get<ExpenseJournalEntry[]>('/expenses')
      setEntries(toExpenseRows(response.data ?? [], expenseCategories))
      setStatus('succeeded')
    } catch {
      setEntries([])
      setStatus('failed')
      setError('Unable to load expense data from accounting-service.')
    }
  }

  useEffect(() => {
    void loadAccounts()
    void loadExpenseCategories()
  }, [])

  useEffect(() => {
    void loadExpenses()
  }, [expenseCategories])

  const loadAccounts = async () => {
    try {
      setAccounts(await accountingAccountsAdapter.list())
    } catch {
      setAccountsError('Unable to load accounting accounts.')
    }
  }

  const loadExpenseCategories = async () => {
    try {
      const categories = await adminAccountingApi.getExpenseCategories()
      setExpenseCategories(categories.filter((category) => category.status === 'ACTIVE'))
    } catch {
      setAccountsError('Unable to load expense categories.')
    }
  }

  const expenseAccounts = accounts.filter((account) => account.status === 'ACTIVE' && account.type === 'EXPENSE')
  const fundingAccounts = accounts.filter((account) => account.status === 'ACTIVE' && ['ASSET', 'LIABILITY', 'EQUITY'].includes(account.type))

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return entries.filter((row) =>
      (!fromDate || row.dateValue >= fromDate) &&
      (!toDate || row.dateValue <= toDate) &&
      (!query || [row.reference, row.expenseAccount, row.fundingAccount, row.category, row.description, row.status].some((value) =>
        value.toLowerCase().includes(query),
      )),
    )
  }, [entries, fromDate, search, toDate])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
  const visibleRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const totalExpenses = filteredRows.reduce((sum, row) => sum + row.amount, 0)

  const handleCreateExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    if (!form.expenseDate) {
      setFormError('Expense date is required.')
      return
    }

    if (!form.expenseCategoryId) {
      setFormError('Expense category is required.')
      return
    }

    if (!form.expenseAccountCode || !form.fundingAccountCode) {
      setFormError('Expense account and funding account are required.')
      return
    }

    if (form.expenseAccountCode === form.fundingAccountCode) {
      setFormError('Expense account and funding account must be different.')
      return
    }

    if (!Number.isFinite(form.amount) || Number(form.amount) <= 0) {
      setFormError('Amount must be greater than zero.')
      return
    }

    setIsCreating(true)

    try {
      const response = await adminAccountingApi.createExpense({
        ...form,
        expenseDate: form.expenseDate,
        expenseCategoryId: form.expenseCategoryId,
        description: form.description?.trim() || undefined,
        amount: Number(form.amount),
      })

      setSuccessMessage(`Expense recorded successfully. Reference ID: ${response.referenceId}`)
      setIsFormOpen(false)
      setForm({
        amount: 0,
        expenseDate: new Date().toISOString().slice(0, 10),
        expenseAccountCode: '',
        fundingAccountCode: '',
        expenseCategoryId: '',
        description: '',
      })
      await loadExpenses()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to record expense.'
      setFormError(message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <span>Accounting</span>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Expenses</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ReceiptText size={22} className="text-orange-600" />
            Expenses
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">Expense journal lines recorded by accounting-service.</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => setIsFormOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700"
          >
            <Plus size={14} />
            {isFormOpen ? 'Close form' : 'Create expense'}
          </button>
          <button
            type="button"
            onClick={() => void loadExpenses()}
            disabled={status === 'loading'}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {isFormOpen && <form onSubmit={handleCreateExpense} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Record expense</h2>
            <p className="text-xs text-slate-500">Create a balanced expense entry for the accounting ledger.</p>
          </div>
          <button type="submit" disabled={isCreating} className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
            {isCreating ? 'Saving...' : 'Save expense'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs text-slate-600">
            Expense date
            <input
              type="date"
              value={form.expenseDate ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, expenseDate: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500"
            />
          </label>
          <label className="text-xs text-slate-600">
            Expense category
            <select
              value={form.expenseCategoryId ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, expenseCategoryId: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500"
            >
              <option value="">Select category</option>
              {expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Expense account
            <select
              value={form.expenseAccountCode ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, expenseAccountCode: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500"
            >
              <option value="">Select expense account</option>
              {expenseAccounts.map((account) => <option key={account.code} value={account.code}>{account.code} · {account.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Funding account
            <select
              value={form.fundingAccountCode ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, fundingAccountCode: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500"
            >
              <option value="">Select funding account</option>
              {fundingAccounts.map((account) => <option key={account.code} value={account.code}>{account.code} · {account.name}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-xs text-slate-600">
            Amount
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500"
            />
          </label>
          <label className="text-xs text-slate-600">
            Description
            <input
              value={form.description ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500"
              placeholder="Office supplies and utilities"
            />
          </label>
        </div>

        {formError && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p>}
        {accountsError && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{accountsError}</p>}
        {successMessage && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{successMessage}</p>}
      </form>}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
          <p className="text-xs text-orange-700">Total expenses</p>
          <p className="mt-1 text-lg font-bold text-orange-900">MMK {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">Expense entries</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{filteredRows.length.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search reference, account, or memo..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1) }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-orange-500"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            From
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => { setFromDate(event.target.value); setPage(1) }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-orange-500"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            To
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => { setToDate(event.target.value); setPage(1) }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-orange-500"
            />
          </label>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => { setFromDate(''); setToDate(''); setPage(1) }}
              className="text-xs font-medium text-orange-700 hover:text-orange-800"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Date', 'Reference', 'Category', 'Expense Account', 'Funding Account', 'Description', 'Status', 'Amount'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-slate-600">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {status === 'loading' && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">Loading expense entries...</td></tr>}
              {status !== 'loading' && status !== 'failed' && visibleRows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">No expense entries found.</td></tr>}
              {status !== 'loading' && visibleRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-4 text-xs text-slate-600">{row.date}</td>
                  <td className="px-4 py-4 text-xs font-medium text-slate-900">{row.reference}</td>
                  <td className="px-4 py-4 text-xs font-medium text-orange-700">{row.category}</td>
                  <td className="px-4 py-4 text-xs text-slate-700">{row.expenseAccount}</td>
                  <td className="px-4 py-4 text-xs text-slate-700">{row.fundingAccount}</td>
                  <td className="max-w-[220px] px-4 py-4 text-xs text-slate-600">{row.description}</td>
                  <td className="px-4 py-4"><span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-medium text-orange-700">{row.status}</span></td>
                  <td className="px-4 py-4 text-right text-xs font-semibold text-orange-700">MMK {row.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          page={page}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalItems={filteredRows.length}
          itemLabel="expense entries"
          onPageChange={setPage}
          onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(1) }}
        />
      </div>
    </div>
  )
}

export default AdminExpensePage
