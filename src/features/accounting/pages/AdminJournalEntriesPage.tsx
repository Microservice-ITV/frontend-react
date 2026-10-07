import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  Check,
  Copy,
  Download,
  Eye,
  FileText,
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
import AccountingStatusBadge from '../components/AccountingStatusBadge'

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

const getLineNarration = (entry: JournalEntry, line: JournalLine, lineIndex: number) => {
  if (line.memo) return line.memo
  if (line.direction === 'CREDIT') return '(Funding offset)'
  const firstDebitIndex = entry.lines.findIndex((entryLine) => entryLine.direction === 'DEBIT')
  return lineIndex === firstDebitIndex ? entry.narration ?? '—' : '—'
}

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
      const response = await ecommerceReadRestClient.get<JournalEntry[]>('/accounting/entries')
      setEntries(response.data ?? [])
      setStatus('succeeded')
    } catch {
      setStatus('failed')
      setError('Unable to load journal entries from the accounting read model.')
    }
  }

  useEffect(() => { void loadEntries() }, [])

  const accounts = useMemo(() => {
    const unique = new Map<string, string>()
    entries.forEach((entry) => entry.lines.forEach((line) => {
      unique.set(line.account.code, `${line.account.code} · ${line.account.name}`)
    }))
    return [...unique.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [entries])

  const entryTypes = useMemo(
    () => [...new Set(entries.map((entry) => entry.referenceType))].sort(),
    [entries],
  )
  const statuses = useMemo(
    () => [...new Set(entries.map((entry) => entry.status))].sort(),
    [entries],
  )

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    return entries.filter((entry) => {
      const lineText = entry.lines
        .map((line) => `${line.account.code} ${line.account.name} ${line.memo ?? ''}`)
        .join(' ')
      const matchesSearch = !query || [
        entry.referenceType,
        entry.referenceId,
        entry.narration ?? '',
        entry.status,
        lineText,
      ].some((value) => value.toLowerCase().includes(query))
      const dateValue = entry.entryDate.slice(0, 10)
      const matchesAccount = accountFilter === 'ALL'
        || entry.lines.some((line) => line.account.code === accountFilter)
      return matchesSearch
        && matchesAccount
        && (entryTypeFilter === 'ALL' || entry.referenceType === entryTypeFilter)
        && (statusFilter === 'ALL' || entry.status === statusFilter)
        && (!fromDate || dateValue >= fromDate)
        && (!toDate || dateValue <= toDate)
    })
  }, [accountFilter, entries, entryTypeFilter, fromDate, search, statusFilter, toDate])

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const visibleEntries = filteredEntries.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const totals = useMemo(() => filteredEntries.reduce((summary, entry) => {
    for (const line of entry.lines) {
      const amount = Number(line.amount)
      if (line.direction === 'DEBIT') summary.debit += amount
      else summary.credit += amount
    }
    if (Math.abs(
      entry.lines.reduce((sum, line) => sum + (line.direction === 'DEBIT' ? Number(line.amount) : -Number(line.amount)), 0),
    ) < 0.01) summary.balanced += 1
    return summary
  }, { debit: 0, credit: 0, balanced: 0 }), [filteredEntries])

  const updateFilter = (update: () => void) => {
    update()
    setPage(1)
  }

  const exportEntries = () => {
    const rows = [
      ['Reference', 'Entry Date', 'Account', 'Description', 'Narration', 'Debit', 'Credit', 'Status'],
      ...filteredEntries.flatMap((entry) => entry.lines.map((line, lineIndex) => [
        lineIndex === 0 ? `${entry.referenceType} · ${entry.referenceId}` : '(same ref)',
        entry.entryDate.slice(0, 10),
        `${line.account.code} · ${line.account.name}`,
        entry.narration ?? '',
        getLineNarration(entry, line, lineIndex),
        line.direction === 'DEBIT' ? Number(line.amount) : '',
        line.direction === 'CREDIT' ? Number(line.amount) : '',
        entry.status,
      ])),
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Journal Entries')
    XLSX.writeFile(workbook, `journal-entries-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const copyReference = async (entry: JournalEntry) => {
    try {
      await navigator.clipboard.writeText(entry.referenceId)
      setNotice('Reference copied to clipboard.')
    } catch {
      setNotice('Could not copy the reference. Select and copy it from the entry details.')
    }
    setOpenActionsId(null)
  }

  const cards = [
    { label: 'Total Entries', value: filteredEntries.length.toLocaleString(), detail: 'Live ledger · selected period', icon: FileText, tone: 'blue' },
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
        <span className="text-slate-900">Journal Entries</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <BookOpen size={25} className="mt-0.5 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Journal Entries</h1>
            <p className="mt-1 text-sm text-slate-500">Read-only ledger entries from the accounting read model.</p>
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
          <div key={label} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
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
              placeholder="Search by reference, account, description..."
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
              disabled={filteredEntries.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {['#', 'Reference', 'Entry Date', 'Account', 'Description', 'Narration', 'Debit', 'Credit', 'Status', ''].map((heading, index) => (
                  <th key={`${heading}-${index}`} className={`px-3 py-3 text-[11px] font-semibold text-slate-500 ${index === 6 || index === 7 ? 'text-right' : 'text-left'}`}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {status === 'loading' && <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-500">Loading journal entries...</td></tr>}
              {status === 'failed' && <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-red-600">{error}</td></tr>}
              {status === 'succeeded' && visibleEntries.length === 0 && <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-500">No journal entries found for these filters.</td></tr>}
              {status === 'succeeded' && visibleEntries.flatMap((entry, entryIndex) => entry.lines.map((line, lineIndex) => {
                const rowNumber = (currentPage - 1) * rowsPerPage + entryIndex + 1
                const lineDescription = line.memo ?? entry.narration ?? '—'
                return (
                  <tr
                    key={`${entry.id}-${line.id}`}
                    className={`border-b border-slate-100 last:border-0 hover:bg-blue-50/40 ${lineIndex === 0 ? 'border-t border-t-slate-200' : ''}`}
                  >
                    <td className="px-3 py-3 text-xs text-slate-400">{lineIndex === 0 ? rowNumber : ''}</td>
                    <td className="max-w-[180px] px-3 py-3 text-xs font-semibold text-blue-700">
                      {lineIndex === 0 ? (
                        <>
                          <span className="block truncate" title={entry.referenceId}>{entry.referenceId}</span>
                          <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-600">
                            {entry.referenceType}
                          </span>
                        </>
                      ) : <span className="font-normal text-slate-400">(same ref)</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {lineIndex === 0 ? <>{formatDate(entry.entryDate)}<span className="mt-0.5 block text-[10px] text-slate-400">{new Date(entry.entryDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span></> : ''}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-700">
                      <span className="font-semibold text-slate-800">{line.account.code}</span>
                      <span className="block max-w-[150px] truncate text-[10px] text-slate-500">{line.account.name}</span>
                    </td>
                    <td className="max-w-[190px] px-3 py-3 text-xs text-slate-600" title={lineDescription}>
                      <span className="block truncate">{lineDescription}</span>
                    </td>
                    <td className="max-w-[210px] px-3 py-3 text-xs text-slate-600" title={getLineNarration(entry, line, lineIndex)}>
                      <span className="block truncate">{getLineNarration(entry, line, lineIndex)}</span>
                    </td>
                    <td className={`px-3 py-3 text-right text-xs font-semibold tabular-nums ${line.direction === 'DEBIT' ? 'text-red-600' : 'text-slate-400'}`}>
                      {line.direction === 'DEBIT' ? formatAmount(Number(line.amount)) : '—'}
                    </td>
                    <td className={`px-3 py-3 text-right text-xs font-semibold tabular-nums ${line.direction === 'CREDIT' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {line.direction === 'CREDIT' ? formatAmount(Number(line.amount)) : '—'}
                    </td>
                    <td className="px-3 py-3"><AccountingStatusBadge status={entry.status} /></td>
                    <td className="relative px-3 py-3 text-right">
                      {lineIndex === 0 && (
                        <>
                          <button
                            type="button"
                            aria-label={`Actions for ${entry.referenceId}`}
                            aria-expanded={openActionsId === entry.id}
                            onClick={() => setOpenActionsId(openActionsId === entry.id ? null : entry.id)}
                            className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
                          >
                            <span className="text-lg leading-none">···</span>
                          </button>
                          {openActionsId === entry.id && (
                            <div className="absolute right-3 top-10 z-20 w-40 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
                              <button type="button" onClick={() => { setSelectedEntry(entry); setOpenActionsId(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                                <Eye size={14} /> View Details
                              </button>
                              <button type="button" onClick={() => void copyReference(entry)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                                <Copy size={14} /> Copy Reference
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
        </div>

        {status === 'succeeded' && filteredEntries.length > 0 && (
          <DataTablePagination
            page={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalItems={filteredEntries.length}
            itemLabel="journal entries"
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
                <p className="mt-1 break-all text-xs text-slate-500">{selectedEntry.referenceType} · {selectedEntry.referenceId}</p>
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
                  {selectedEntry.lines.map((line) => (
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
