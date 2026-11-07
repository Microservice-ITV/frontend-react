import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  Info,
  Landmark,
  RefreshCw,
  Scale,
  Search,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { ecommerceReadRestClient } from '@/lib/api/ecommerceReadRestClient'
import { accountingClient } from '@/lib/api/accountingClient'
import { accountingExpensesAdapter } from '../adapters/accountingExpensesAdapter'
import AccountingStatusBadge from '../components/AccountingStatusBadge'
import type { AccountingExpense } from '../types/expenseTypes'
import {
  accountingReferenceKey,
  formatAccountingReferences,
} from '../utils/accountingReferenceFormatting'

type JournalLine = {
  id: string
  direction: 'DEBIT' | 'CREDIT'
  amount: number | string
  memo: string | null
  account: { code: string; name: string }
}

type JournalEntry = {
  id: string
  referenceType: string
  referenceId: string
  narration: string | null
  entryDate: string
  status: string
  lines: JournalLine[]
}

type ReturnRecord = {
  id: string
  referenceType: 'ORDER_RETURNED'
  referenceId: string
  eventId: string
  orderId: string
  shopId: string
  reason: string
  returnedAt: string
  status: 'RETURNED'
}

type ExpenseRecord = Pick<
  AccountingExpense,
  'id' | 'expenseNo' | 'shopId' | 'amount' | 'currency' | 'expenseDate' | 'status' | 'expenseTypeId' | 'description' | 'approvedAt'
> & {
  expenseType?: { name?: string | null; code?: string | null } | null
}

type LedgerRecord =
  | { kind: 'journal'; entry: JournalEntry; entryDate: string; referenceType: string; referenceId: string; status: string }
  | { kind: 'return'; record: ReturnRecord; entryDate: string; referenceType: 'ORDER_RETURNED'; referenceId: string; status: 'RETURNED' }
  | { kind: 'expense'; expense: ExpenseRecord; entryDate: string; referenceType: 'EXPENSE_REQUEST'; referenceId: string; status: string }

const ledgerExpenseStatuses: readonly AccountingExpense['status'][] = [
  'PENDING',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
]

const formatAmount = (value: number) => value.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatApprovalDateTime = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Approval time unavailable'
    : `Approved · ${date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })}`
}

const getJournalLines = (entry: JournalEntry): JournalLine[] =>
  Array.isArray(entry.lines) ? entry.lines : []

const isLedgerExpenseStatus = (status: AccountingExpense['status']) =>
  ledgerExpenseStatuses.includes(status)

const expenseStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Pending'
    case 'PENDING_APPROVAL': return 'Pending Approval'
    case 'APPROVED': return 'Approved'
    case 'REJECTED': return 'Rejected'
    default: return status
  }
}

const expenseRecordLabel = (status: string) => {
  switch (status) {
    case 'PENDING':
    case 'PENDING_APPROVAL':
      return 'Expense Request'
    case 'APPROVED':
      return 'Approved Expense'
    case 'REJECTED':
      return 'Rejected Expense'
    default:
      return 'Expense'
  }
}

const getLineNarration = (entry: JournalEntry, line: JournalLine, lineIndex: number) => {
  if (line.memo) return line.memo
  if (line.direction === 'CREDIT') return '(Funding offset)'
  const firstDebitIndex = getJournalLines(entry).findIndex((entryLine) => entryLine.direction === 'DEBIT')
  return lineIndex === firstDebitIndex ? entry.narration ?? '—' : '—'
}

const entryGroupStyles = [
  { background: 'bg-blue-50/70 hover:bg-blue-50', border: 'border-blue-200', accent: 'border-l-blue-500' },
  { background: 'bg-amber-50/70 hover:bg-amber-50', border: 'border-amber-200', accent: 'border-l-amber-500' },
  { background: 'bg-emerald-50/70 hover:bg-emerald-50', border: 'border-emerald-200', accent: 'border-l-emerald-500' },
  { background: 'bg-violet-50/70 hover:bg-violet-50', border: 'border-violet-200', accent: 'border-l-violet-500' },
  { background: 'bg-rose-50/70 hover:bg-rose-50', border: 'border-rose-200', accent: 'border-l-rose-500' },
]

const monthStart = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

const monthEnd = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
}

const AdminJournalEntriesPage = ({
  dashboardPath = '/super-admin/overview',
}: {
  dashboardPath?: string
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [returnRecords, setReturnRecords] = useState<ReturnRecord[]>([])
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState(monthStart)
  const [toDate, setToDate] = useState(monthEnd)
  const [accountFilter, setAccountFilter] = useState('ALL')
  const [entryTypeFilter, setEntryTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [openActionsId, setOpenActionsId] = useState<string | null>(null)

  const loadEntries = async () => {
    setStatus('loading')
    setError(null)
    try {
      const [entriesResponse, returnsResponse, expenseRecords] = await Promise.all([
        ecommerceReadRestClient.get<JournalEntry[]>('/accounting/entries'),
        accountingClient.get<ReturnRecord[]>('/returns'),
        accountingExpensesAdapter.list(ledgerExpenseStatuses),
      ])
      setEntries(entriesResponse.data ?? [])
      setReturnRecords(returnsResponse.data ?? [])
      setExpenses(expenseRecords)
      setStatus('succeeded')
    } catch {
      setStatus('failed')
      setError('Unable to load ledger entries, expense records, and return records.')
    }
  }

  useEffect(() => { void loadEntries() }, [])

  const formattedJournalReferences = useMemo(() => {
    const references = formatAccountingReferences(entries.map((entry) => ({
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      date: entry.entryDate,
    })))
    return new Map(entries.map((entry) => [
      entry.id,
      references.get(accountingReferenceKey({
        referenceType: entry.referenceType,
        referenceId: entry.referenceId,
        date: entry.entryDate,
      })) ?? `${entry.referenceType} · ${entry.referenceId}`,
    ]))
  }, [entries])

  const expensesByReference = useMemo(
    () => new Map(expenses.map((expense) => [expense.expenseNo, expense])),
    [expenses],
  )
  const journalExpenseReferences = useMemo(
    () => new Set(entries
      .filter((entry) => entry.referenceType === 'EXPENSE')
      .map((entry) => entry.referenceId)),
    [entries],
  )

  const accounts = useMemo(() => {
    const unique = new Map<string, string>()
    entries.forEach((entry) => getJournalLines(entry).forEach((line) => {
      unique.set(line.account.code, `${line.account.code} · ${line.account.name}`)
    }))
    return [...unique.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [entries])

  const entryTypes = useMemo(
    () => [...new Set([
      ...entries.map((entry) => entry.referenceType),
      ...(returnRecords.length > 0 ? ['ORDER_RETURNED'] : []),
      ...(expenses.some((expense) => isLedgerExpenseStatus(expense.status)
        && (expense.status !== 'APPROVED' || !journalExpenseReferences.has(expense.expenseNo)))
        ? ['EXPENSE_REQUEST']
        : []),
    ])].sort(),
    [entries, expenses, journalExpenseReferences, returnRecords.length],
  )
  const statuses = useMemo(
    () => [...new Set([
      ...entries.map((entry) => entry.status),
      ...(returnRecords.length > 0 ? ['RETURNED'] : []),
      ...expenses
        .filter((expense) => isLedgerExpenseStatus(expense.status))
        .map((expense) => expense.status),
    ])].sort(),
    [entries, expenses, returnRecords.length],
  )

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    return entries.filter((entry) => {
      const lines = getJournalLines(entry)
      const expense = entry.referenceType === 'EXPENSE'
        ? expensesByReference.get(entry.referenceId)
        : undefined
      const lineText = lines
        .map((line) => `${line.account.code} ${line.account.name} ${line.memo ?? ''}`)
        .join(' ')
      const matchesSearch = !query || [
        entry.referenceType,
        entry.referenceId,
        formattedJournalReferences.get(entry.id) ?? '',
        entry.narration ?? '',
        entry.status,
        ...(expense ? [
          expenseRecordLabel(expense.status),
          expense.expenseType?.name ?? expense.expenseTypeId,
          expense.shopId ?? '',
          expense.description ?? '',
          expense.amount,
          expense.currency,
          expense.status,
        ] : []),
        lineText,
      ].some((value) => value.toLowerCase().includes(query))
      const dateValue = entry.entryDate.slice(0, 10)
      const matchesAccount = accountFilter === 'ALL'
        || lines.some((line) => line.account.code === accountFilter)
      return matchesSearch
        && matchesAccount
        && (entryTypeFilter === 'ALL'
          || entry.referenceType === entryTypeFilter
          || (entryTypeFilter === 'EXPENSE_REQUEST' && expense !== undefined))
        && (statusFilter === 'ALL' || entry.status === statusFilter || expense?.status === statusFilter)
        && (!fromDate || dateValue >= fromDate)
        && (!toDate || dateValue <= toDate)
    })
  }, [accountFilter, entries, entryTypeFilter, expensesByReference, formattedJournalReferences, fromDate, search, statusFilter, toDate])

  const filteredReturnRecords = useMemo(() => {
    const query = search.trim().toLowerCase()
    return returnRecords.filter((record) => {
      const dateValue = record.returnedAt.slice(0, 10)
      const matchesSearch = !query || [
        record.referenceType,
        record.orderId,
        record.shopId,
        record.reason,
        record.status,
      ].some((value) => value.toLowerCase().includes(query))
      return matchesSearch
        && accountFilter === 'ALL'
        && (entryTypeFilter === 'ALL' || entryTypeFilter === 'ORDER_RETURNED')
        && (statusFilter === 'ALL' || statusFilter === 'RETURNED')
        && (!fromDate || dateValue >= fromDate)
        && (!toDate || dateValue <= toDate)
    })
  }, [accountFilter, entryTypeFilter, fromDate, returnRecords, search, statusFilter, toDate])

  const filteredExpenseRecords = useMemo(() => {
    const query = search.trim().toLowerCase()
    return expenses.filter((expense) => {
      if (!isLedgerExpenseStatus(expense.status)) return false
      if (expense.status === 'APPROVED' && journalExpenseReferences.has(expense.expenseNo)) return false
      const dateValue = expense.expenseDate.slice(0, 10)
      const matchesSearch = !query || [
        expenseRecordLabel(expense.status),
        expense.expenseNo,
        expense.shopId ?? '',
        expense.expenseType?.name ?? expense.expenseTypeId,
        expense.description ?? '',
        expense.amount,
        expense.currency,
        expense.status,
      ].some((value) => value.toLowerCase().includes(query))
      return matchesSearch
        && accountFilter === 'ALL'
        && (entryTypeFilter === 'ALL' || entryTypeFilter === 'EXPENSE_REQUEST')
        && (statusFilter === 'ALL' || expense.status === statusFilter)
        && (!fromDate || dateValue >= fromDate)
        && (!toDate || dateValue <= toDate)
    })
  }, [accountFilter, entryTypeFilter, expenses, fromDate, journalExpenseReferences, search, statusFilter, toDate])

  const ledgerRecords = useMemo<LedgerRecord[]>(() => [
    ...filteredEntries.map((entry): LedgerRecord => ({
      kind: 'journal',
      entry,
      entryDate: entry.entryDate,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      status: entry.status,
    })),
    ...filteredReturnRecords.map((record): LedgerRecord => ({
      kind: 'return',
      record,
      entryDate: record.returnedAt,
      referenceType: record.referenceType,
      referenceId: record.referenceId,
      status: record.status,
    })),
    ...filteredExpenseRecords.map((expense): LedgerRecord => ({
      kind: 'expense',
      expense,
      entryDate: expense.expenseDate,
      referenceType: 'EXPENSE_REQUEST',
      referenceId: expense.expenseNo,
      status: expense.status,
    })),
  ].sort((left, right) => new Date(right.entryDate).getTime() - new Date(left.entryDate).getTime()), [
    filteredExpenseRecords,
    filteredEntries,
    filteredReturnRecords,
  ])

  const totalPages = Math.max(1, Math.ceil(ledgerRecords.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const visibleRecords = ledgerRecords.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const totals = useMemo(() => filteredEntries.reduce((summary, entry) => {
    const lines = getJournalLines(entry)
    for (const line of lines) {
      const amount = Number(line.amount)
      if (line.direction === 'DEBIT') summary.debit += amount
      else summary.credit += amount
    }
    if (lines.length > 0 && Math.abs(
      lines.reduce((sum, line) => sum + (line.direction === 'DEBIT' ? Number(line.amount) : -Number(line.amount)), 0),
    ) < 0.01) summary.balanced += 1
    return summary
  }, { debit: 0, credit: 0, balanced: 0 }), [filteredEntries])

  const updateFilter = (update: () => void) => {
    update()
    setPage(1)
  }

  const exportEntries = () => {
    const rows = [
      ['Reference', 'Record Type', 'Entry Date', 'Category', 'Shop', 'Account', 'Description', 'Narration', 'Amount', 'Currency', 'Debit', 'Credit', 'Status'],
      ...filteredEntries.flatMap((entry) => {
        const lines = getJournalLines(entry)
        const expense = entry.referenceType === 'EXPENSE'
          ? expenses.find((item) => item.expenseNo === entry.referenceId)
          : undefined
        if (lines.length === 0) {
          return [[
            expense?.expenseNo ?? formattedJournalReferences.get(entry.id) ?? entry.referenceId,
            expense ? 'Approved Expense' : 'Journal Entry',
            entry.entryDate.slice(0, 10),
            expense?.expenseType?.name ?? '',
            expense?.shopId ?? '',
            '',
            'Journal lines unavailable',
            entry.narration ?? '',
            expense ? Number(expense.amount) : '',
            expense?.currency ?? '',
            '',
            '',
            expense?.status ?? entry.status,
          ]]
        }
        return lines.map((line, lineIndex) => [
          lineIndex === 0 ? (expense?.expenseNo ?? formattedJournalReferences.get(entry.id) ?? entry.referenceId) : '(same ref)',
          expense ? 'Approved Expense' : 'Journal Entry',
          entry.entryDate.slice(0, 10),
          lineIndex === 0 ? expense?.expenseType?.name ?? '' : '',
          lineIndex === 0 ? expense?.shopId ?? '' : '',
          `${line.account.code} · ${line.account.name}`,
          entry.narration ?? '',
          getLineNarration(entry, line, lineIndex),
          lineIndex === 0 && expense ? Number(expense.amount) : '',
          lineIndex === 0 ? expense?.currency ?? '' : '',
          line.direction === 'DEBIT' ? Number(line.amount) : '',
          line.direction === 'CREDIT' ? Number(line.amount) : '',
          expense?.status ?? entry.status,
        ])
      }),
      ...filteredReturnRecords.map((record) => [
        record.orderId,
        'Return Record',
        record.returnedAt.slice(0, 10),
        '',
        record.shopId,
        '',
        `${record.referenceType} · Shop ID: ${record.shopId}`,
        record.reason,
        '',
        '',
        '',
        '',
        record.status,
      ]),
      ...filteredExpenseRecords.map((expense) => [
        expense.expenseNo,
        `${expenseRecordLabel(expense.status)} · Not Posted`,
        expense.expenseDate.slice(0, 10),
        expense.expenseType?.name ?? expense.expenseTypeId,
        expense.shopId ?? '',
        '',
        'Informational only · no journal entry',
        expense.description ?? '',
        Number(expense.amount),
        expense.currency,
        '',
        '',
        expense.status,
      ]),
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger Entries')
    XLSX.writeFile(workbook, `ledger-entries-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const copyReference = async (entry: JournalEntry) => {
    try {
      await navigator.clipboard.writeText(
        formattedJournalReferences.get(entry.id) ?? entry.referenceId,
      )
      setNotice('Reference copied to clipboard.')
    } catch {
      setNotice('Could not copy the reference. Select and copy it from the entry details.')
    }
    setOpenActionsId(null)
  }

  const cards = [
    { label: 'Journal Entries', value: filteredEntries.length.toLocaleString(), detail: 'Posted financial entries · selected period', icon: FileText, tone: 'blue' },
    { label: 'Total Debit', value: formatAmount(totals.debit), detail: 'Summed from loaded journal lines', icon: Landmark, tone: 'green' },
    { label: 'Total Credit', value: formatAmount(totals.credit), detail: 'Summed from loaded journal lines', icon: BookOpen, tone: 'violet' },
    { label: 'Balanced Entries', value: totals.balanced.toLocaleString(), detail: `${filteredEntries.length ? Math.round((totals.balanced / filteredEntries.length) * 100) : 0}% of loaded entries`, icon: Scale, tone: 'amber' },
  ]
  const dataUnavailable = status !== 'succeeded'

  return (
    <div className="space-y-5">
      <nav className="text-xs text-slate-500">
        <Link to={dashboardPath} className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-2">/</span>
        <span>Accounting</span>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Ledger Entries</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <BookOpen size={25} className="mt-0.5 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Ledger Entries</h1>
            <p className="mt-1 text-sm text-slate-500">Read-only journal entries, expense records, and seller return records.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <CalendarDays size={15} className="text-slate-400" />
            <span className="sr-only">From date</span>
            <input
              aria-label="From date"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => updateFilter(() => setFromDate(event.target.value))}
              className="min-w-0 bg-transparent outline-none"
            />
            <span>–</span>
            <span className="sr-only">To date</span>
            <input
              aria-label="To date"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => updateFilter(() => setToDate(event.target.value))}
              className="min-w-0 bg-transparent outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => void loadEntries()}
            disabled={status === 'loading'}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {notice && (
        <div role="status" className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {notice}
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice"><X size={15} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, detail, icon: Icon, tone }) => (
          <div key={label} className={`flex min-w-0 items-center gap-3 rounded-xl border px-4 py-4 shadow-sm ${
            tone === 'blue' ? 'border-blue-100 bg-blue-50/60'
              : tone === 'green' ? 'border-emerald-100 bg-emerald-50/60'
                : tone === 'violet' ? 'border-violet-100 bg-violet-50/60'
                  : 'border-amber-100 bg-amber-50/60'
          }`}>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              tone === 'blue' ? 'bg-blue-50 text-blue-600'
                : tone === 'green' ? 'bg-emerald-50 text-emerald-600'
                  : tone === 'violet' ? 'bg-violet-50 text-violet-600'
                    : 'bg-amber-50 text-amber-600'
            }`}>
              <Icon size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="mt-1 truncate text-lg font-bold tabular-nums text-slate-900" title={dataUnavailable ? error ?? 'Loading ledger data' : value}>
                {dataUnavailable ? '—' : value}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {status === 'loading' ? 'Loading live ledger…' : status === 'failed' ? 'Ledger data unavailable' : detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => updateFilter(() => setSearch(event.target.value))}
              placeholder="Search references, accounts, shops, or return reasons..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-blue-400"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by account"
              value={accountFilter}
              onChange={(event) => updateFilter(() => setAccountFilter(event.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none"
            >
              <option value="ALL">All Accounts</option>
              {accounts.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
            <select
              aria-label="Filter by entry type"
              value={entryTypeFilter}
              onChange={(event) => updateFilter(() => setEntryTypeFilter(event.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none"
            >
              <option value="ALL">All Entry Types</option>
              {entryTypes.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => updateFilter(() => setStatusFilter(event.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none"
            >
              <option value="ALL">All Statuses</option>
              {statuses.map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
            </select>
            <button
              type="button"
              onClick={exportEntries}
              disabled={ledgerRecords.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        <p role="note" className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/60 px-4 py-2 text-xs text-blue-800">
          <Info size={14} className="shrink-0" />
          Unposted expense records and return records are informational only; they do not affect debit, credit, trial balance, or P&amp;L.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] table-fixed">
            <colgroup>
              {['4%', '17%', '10%', '12%', '15%', '16%', '9%', '9%', '8%'].map((width, index) => (
                <col key={index} style={{ width }} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {['#', 'Reference', 'Entry Date', 'Account', 'Description', 'Narration', 'Debit', 'Credit', 'Status'].map((heading, index) => (
                  <th key={`${heading}-${index}`} className={`px-3 py-3 text-[11px] font-semibold text-slate-500 ${index === 6 || index === 7 ? 'text-right' : 'text-left'}`}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {status === 'loading' && <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">Loading journal entries...</td></tr>}
              {status === 'failed' && <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-red-600">{error}</td></tr>}
              {status === 'succeeded' && visibleRecords.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">No ledger records found for these filters.</td></tr>}
              {status === 'succeeded' && visibleRecords.flatMap((record, entryIndex) => {
                const groupStyle = entryGroupStyles[entryIndex % entryGroupStyles.length] ?? entryGroupStyles[0]
                const rowNumber = (currentPage - 1) * rowsPerPage + entryIndex + 1
                if (record.kind === 'expense') {
                  const expense = record.expense
                  const category = expense.expenseType?.name ?? expense.expenseTypeId
                  const expenseTone = expense.status === 'APPROVED'
                    ? 'border-emerald-200 border-l-emerald-500 bg-emerald-50/70 hover:bg-emerald-50'
                    : expense.status === 'REJECTED'
                      ? 'border-rose-200 border-l-rose-500 bg-rose-50/70 hover:bg-rose-50'
                      : 'border-amber-200 border-l-amber-500 bg-amber-50/70 hover:bg-amber-50'
                  return [(
                    <tr
                      key={expense.id}
                      className={`border-x border-y-2 border-l-4 ${expenseTone}`}
                    >
                      <td className="w-9 px-2 py-3 text-xs text-slate-400">{rowNumber}</td>
                      <td className="max-w-[180px] px-3 py-3 text-xs font-semibold text-slate-800">
                        <span className="block truncate" title={expense.expenseNo}>{expense.expenseNo}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">{formatDate(expense.expenseDate)}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">—</td>
                      <td className="max-w-[190px] px-3 py-3 text-xs text-slate-800" title={category}>
                        <span className="block truncate font-semibold">{expenseRecordLabel(expense.status)} · Not Posted</span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-500">{category} · {expense.shopId ?? 'Platform'}</span>
                      </td>
                      <td className="max-w-[210px] px-3 py-3 text-xs text-slate-600" title={expense.description ?? ''}>
                        <span className="block truncate">{expense.description || '—'}</span>
                        <span className="mt-0.5 block text-[10px] text-slate-500">{expense.currency} {formatAmount(Number(expense.amount))}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-slate-400">—</td>
                      <td className="px-3 py-3 text-right text-xs text-slate-400">—</td>
                      <td className="px-3 py-3"><AccountingStatusBadge status={expense.status}><span>{expenseStatusLabel(expense.status)}</span></AccountingStatusBadge></td>
                    </tr>
                  )]
                }
                const isReturn = record.kind === 'return'
                const entry = isReturn ? null : record.entry
                const rowId = isReturn ? record.record.id : record.entry.id
                const expense = !isReturn && record.referenceType === 'EXPENSE'
                  ? expenses.find((item) => item.expenseNo === record.referenceId)
                  : undefined
                const reference = isReturn
                  ? record.record.orderId
                  : expense?.expenseNo ?? formattedJournalReferences.get(record.entry.id) ?? record.entry.referenceId
                const date = isReturn ? record.record.returnedAt : record.entry.entryDate
                const description = isReturn
                  ? `${record.record.referenceType} · Shop ID: ${record.record.shopId}`
                  : record.entry.narration ?? '—'
                const narration = isReturn ? record.record.reason : null

                if (isReturn || !entry) {
                  return [(
                    <tr
                      key={rowId}
                      className={`group border-x border-y-2 border-l-4 ${groupStyle.border} ${groupStyle.accent} ${groupStyle.background}`}
                    >
                      <td className="w-9 px-2 py-3 text-xs text-slate-400">{rowNumber}</td>
                      <td className="max-w-[180px] px-3 py-3 text-xs font-semibold text-blue-700">
                        <span className="block truncate" title={record.referenceId}>{reference}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {formatDate(date)}
                        <span className="mt-0.5 block text-[10px] text-slate-400">
                          {new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">—</td>
                      <td className="max-w-[190px] px-3 py-3 text-xs text-slate-600" title={description}>
                        <span className="block truncate">{description}</span>
                      </td>
                      <td className="max-w-[210px] px-3 py-3 text-xs text-slate-600" title={narration ?? ''}>
                        <span className="block truncate">{narration || '—'}</span>
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-slate-400">—</td>
                      <td className="px-3 py-3 text-right text-xs text-slate-400">—</td>
                      <td className="px-3 py-3"><AccountingStatusBadge status="RETURNED" /></td>
                    </tr>
                  )]
                }

                const journalLines = getJournalLines(entry)
                if (journalLines.length === 0) {
                  return [(
                    <tr
                      key={entry.id}
                      className={`group border-x border-y-2 border-l-4 ${groupStyle.border} ${groupStyle.accent} ${groupStyle.background}`}
                    >
                      <td className="w-9 px-2 py-3 text-xs text-slate-400">{rowNumber}</td>
                      <td className="max-w-[180px] px-3 py-3 text-xs font-semibold text-blue-700">
                        <span className="block truncate" title={reference}>{reference}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {formatDate(date)}
                        <span className="mt-0.5 block text-[10px] text-slate-400">
                          {new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">—</td>
                      <td className="max-w-[190px] px-3 py-3 text-xs text-amber-700">
                        {expense ? 'Approved Expense · ' : ''}Journal lines unavailable
                        {expense && (
                          <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                            {expense.expenseType?.name ?? expense.expenseTypeId} · {expense.shopId ?? 'Platform'}
                          </span>
                        )}
                      </td>
                      <td className="max-w-[210px] px-3 py-3 text-xs text-slate-600">
                        {entry.narration ?? '—'}
                        {expense && (
                          <span className="mt-0.5 block text-[10px] text-slate-500">
                            {expense.currency} {formatAmount(Number(expense.amount))}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-slate-400">—</td>
                      <td className="px-3 py-3 text-right text-xs text-slate-400">—</td>
                      <td className="px-3 py-3">
                        <AccountingStatusBadge status={expense?.status ?? entry.status}>
                          {expense ? <span>Approved · Posted</span> : undefined}
                        </AccountingStatusBadge>
                      </td>
                    </tr>
                  )]
                }

                return journalLines.map((line, lineIndex) => {
                  const lineDescription = line.memo ?? entry.narration ?? '—'
                  const displayedDescription = expense && lineIndex === 0
                    ? `Approved Expense · ${lineDescription}`
                    : lineDescription
                  return (
                    <tr
                      key={`${entry.id}-${line.id}`}
                      className={`group border-x border-l-4 ${groupStyle.border} ${groupStyle.accent} ${groupStyle.background} ${
                        lineIndex === 0 ? 'border-t-2' : 'border-t'
                      } ${
                        lineIndex === journalLines.length - 1 ? 'border-b-2' : 'border-b-0'
                      }`}
                    >
                      <td className="w-9 px-2 py-3 text-xs text-slate-400">{lineIndex === 0 ? rowNumber : ''}</td>
                      <td className="relative max-w-[180px] px-3 py-3 text-xs font-semibold text-blue-700">
                        {lineIndex === 0 ? (
                          <>
                            <span className="block truncate pr-5" title={reference}>{reference}</span>
                            <button
                              type="button"
                              aria-label={`Actions for ${reference}`}
                              title="Entry actions: view details or copy reference"
                              aria-expanded={openActionsId === entry.id}
                              onClick={() => setOpenActionsId(openActionsId === entry.id ? null : entry.id)}
                              className="absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-slate-500 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              <span className="text-base leading-none">···</span>
                            </button>
                            {openActionsId === entry.id && (
                              <div className="absolute right-2 top-8 z-20 w-36 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
                                <button type="button" onClick={() => { setSelectedEntry(entry); setOpenActionsId(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                                  <Eye size={14} /> View Details
                                </button>
                                <button type="button" onClick={() => void copyReference(entry)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                                  <Copy size={14} /> Copy Reference
                                </button>
                              </div>
                            )}
                          </>
                        ) : <span className="font-normal text-slate-400">(same ref)</span>}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {lineIndex === 0 && (
                          <>
                            {formatDate(date)}
                            <span
                              className={`mt-0.5 block text-[10px] ${expense?.approvedAt ? 'text-emerald-700' : 'text-slate-400'}`}
                              title={expense?.approvedAt ? new Date(expense.approvedAt).toLocaleString() : undefined}
                            >
                              {expense
                                ? expense.approvedAt
                                  ? formatApprovalDateTime(expense.approvedAt)
                                  : expense.status === 'APPROVED'
                                    ? 'Approval time unavailable'
                                    : 'Expense date'
                                : new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-700">
                        <span className="font-semibold text-slate-800">{line.account.code}</span>
                        <span className="block max-w-[150px] truncate text-[10px] text-slate-500">{line.account.name}</span>
                      </td>
                      <td className="max-w-[190px] px-3 py-3 text-xs text-slate-600" title={displayedDescription}>
                        <span className="block truncate">{displayedDescription}</span>
                        {expense && lineIndex === 0 && (
                          <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                            {expense.expenseType?.name ?? expense.expenseTypeId} · {expense.shopId ?? 'Platform'}
                          </span>
                        )}
                      </td>
                      <td className="max-w-[210px] px-3 py-3 text-xs text-slate-600" title={getLineNarration(entry, line, lineIndex)}>
                        <span className="block truncate">{getLineNarration(entry, line, lineIndex)}</span>
                        {expense && lineIndex === 0 && (
                          <span className="mt-0.5 block text-[10px] text-slate-500">
                            {expense.currency} {formatAmount(Number(expense.amount))}
                          </span>
                        )}
                      </td>
                      <td className={`px-3 py-3 text-right text-xs font-semibold tabular-nums ${line.direction === 'DEBIT' ? 'text-red-600' : 'text-slate-400'}`}>
                        {line.direction === 'DEBIT' ? formatAmount(Number(line.amount)) : '—'}
                      </td>
                      <td className={`px-3 py-3 text-right text-xs font-semibold tabular-nums ${line.direction === 'CREDIT' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {line.direction === 'CREDIT' ? formatAmount(Number(line.amount)) : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <AccountingStatusBadge status={expense?.status ?? entry.status}>
                          {expense ? <span>Approved · Posted</span> : undefined}
                        </AccountingStatusBadge>
                      </td>
                    </tr>
                  )
                })
              })}
            </tbody>
          </table>
        </div>

        {status === 'succeeded' && ledgerRecords.length > 0 && (
          <DataTablePagination
            page={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={ledgerRecords.length}
            itemLabel="ledger records"
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value)
              setPage(1)
            }}
          />
        )}
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedEntry(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="journal-entry-details-title" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 id="journal-entry-details-title" className="text-base font-bold text-slate-900">Journal Entry Details</h2>
                <p className="mt-1 break-all text-xs text-slate-500">
                  {formattedJournalReferences.get(selectedEntry.id) ?? selectedEntry.referenceId}
                </p>
              </div>
              <button type="button" aria-label="Close details" onClick={() => setSelectedEntry(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={17} /></button>
            </div>
            <div className="grid gap-3 px-5 py-4 sm:grid-cols-3">
              <div><p className="text-[11px] text-slate-400">Entry date</p><p className="mt-1 text-sm font-medium text-slate-800">{formatDate(selectedEntry.entryDate)}</p></div>
              <div><p className="text-[11px] text-slate-400">Status</p><div className="mt-1"><AccountingStatusBadge status={selectedEntry.status} /></div></div>
              <div><p className="text-[11px] text-slate-400">Narration</p><p className="mt-1 text-sm text-slate-700">{selectedEntry.narration ?? '—'}</p></div>
            </div>
            <div className="overflow-x-auto px-5 pb-5">
              <table className="w-full min-w-[500px]">
                <thead><tr className="border-y border-slate-100 bg-slate-50 text-left text-[11px] font-semibold text-slate-500"><th className="px-3 py-2">Account</th><th className="px-3 py-2">Memo</th><th className="px-3 py-2 text-right">Debit</th><th className="px-3 py-2 text-right">Credit</th></tr></thead>
                <tbody>
                  {getJournalLines(selectedEntry).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-xs text-amber-700">
                        Journal lines unavailable for this entry.
                      </td>
                    </tr>
                  )}
                  {getJournalLines(selectedEntry).map((line) => (
                    <tr key={line.id} className="border-b border-slate-100 text-xs">
                      <td className="px-3 py-3 text-slate-700">{line.account.code} · {line.account.name}</td>
                      <td className="px-3 py-3 text-slate-500">{line.memo ?? '—'}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-red-600">{line.direction === 'DEBIT' ? formatAmount(Number(line.amount)) : '—'}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-emerald-600">{line.direction === 'CREDIT' ? formatAmount(Number(line.amount)) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => setSelectedEntry(null)} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Check size={14} className="mr-1 inline" />Done</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default AdminJournalEntriesPage
