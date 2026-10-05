import { useEffect, useMemo, useState } from 'react'
import { Download, FileText, RefreshCw, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { accountingClient } from '@/lib/api/accountingClient'

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

const formatAmount = (value: number) => value.toLocaleString()
const formatDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
const getLineNarration = (entry: JournalEntry, line: JournalLine, lineIndex: number) => {
  if (line.memo) return line.memo
  if (line.direction === 'CREDIT') return '(Funding offset)'
  const firstDebitIndex = entry.lines.findIndex((entryLine) => entryLine.direction === 'DEBIT')
  return lineIndex === firstDebitIndex ? entry.narration ?? '—' : '—'
}
const AdminJournalEntriesPage = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'failed'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const loadEntries = async () => {
    setStatus('loading')
    setError(null)
    try {
      const response = await accountingClient.get<JournalEntry[]>('/entries')
      setEntries(response.data ?? [])
      setStatus('succeeded')
    } catch {
      setStatus('failed')
      setEntries([])
      setError('Unable to load journal entries from accounting-service.')
    }
  }

  useEffect(() => { void loadEntries() }, [])

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    return entries.filter((entry) => {
      const lineText = entry.lines.map((line) => `${line.account.code} ${line.account.name} ${line.memo ?? ''}`).join(' ')
      const matchesSearch = !query || [entry.referenceType, entry.referenceId, entry.narration ?? '', entry.status, lineText].some((value) => value.toLowerCase().includes(query))
      const dateValue = entry.entryDate.slice(0, 10)
      return matchesSearch && (!fromDate || dateValue >= fromDate) && (!toDate || dateValue <= toDate)
    })
  }, [entries, fromDate, search, toDate])

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / rowsPerPage))
  const visibleEntries = filteredEntries.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  const exportEntries = () => {
    const rows = [
      ['Date', 'Reference', 'Description', 'Debit Accounts', 'Credit Accounts', 'Debit', 'Credit', 'Status'],
      ...filteredEntries.map((entry) => {
        const debitLines = entry.lines.filter((line) => line.direction === 'DEBIT')
        const creditLines = entry.lines.filter((line) => line.direction === 'CREDIT')
        return [
          entry.entryDate.slice(0, 10),
          `${entry.referenceType} · ${entry.referenceId}`,
          entry.narration ?? '',
          debitLines.map((line) => `${line.account.code} · ${line.account.name}`).join('; '),
          creditLines.map((line) => `${line.account.code} · ${line.account.name}`).join('; '),
          debitLines.reduce((sum, line) => sum + Number(line.amount), 0),
          creditLines.reduce((sum, line) => sum + Number(line.amount), 0),
          entry.status,
        ]
      }),
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Journal Entries')
    XLSX.writeFile(workbook, `journal-entries-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500"><Link to="/super-admin/overview" className="hover:text-slate-700">Dashboard</Link><span className="mx-1">/</span><span>Accounting</span><span className="mx-1">/</span><span className="text-slate-900">Journal Entries</span></nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"><FileText size={22} className="text-orange-600" />Journal Entries</h1><p className="mt-0.5 text-sm text-slate-600">Balanced journal entries recorded by accounting-service.</p></div><div className="flex items-center gap-2 self-start"><button type="button" onClick={exportEntries} disabled={filteredEntries.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"><Download size={14} />Export</button><button type="button" onClick={() => void loadEntries()} disabled={status === 'loading'} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} />Refresh</button></div></div>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" placeholder="Search reference, account, or description..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-orange-500" /></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><label className="flex items-center gap-2 text-xs text-slate-600">From<input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => { setFromDate(event.target.value); setPage(1) }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-orange-500" /></label><label className="flex items-center gap-2 text-xs text-slate-600">To<input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => { setToDate(event.target.value); setPage(1) }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-orange-500" /></label>{(fromDate || toDate) && <button type="button" onClick={() => { setFromDate(''); setToDate(''); setPage(1) }} className="text-xs font-medium text-orange-700 hover:text-orange-800">Clear dates</button>}</div></div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Reference', 'Entry Date', 'Account Name', 'Narration', 'Debit', 'Credit', 'Status'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-slate-600">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {status === 'loading' && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">Loading journal entries...</td></tr>}
              {status !== 'loading' && status !== 'failed' && visibleEntries.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No journal entries found.</td></tr>}
              {status !== 'loading' && visibleEntries.map((entry) => entry.lines.map((line, lineIndex) => (
                <tr
                  key={`${entry.id}-${line.id}`}
                  className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${lineIndex === 0 ? 'border-t-2 border-t-slate-200' : ''}`}
                >
                  <td className="px-4 py-3 text-xs font-medium text-slate-900">
                    {lineIndex === 0 ? entry.referenceId : <span className="text-slate-400">(same ref)</span>}
                    {lineIndex === 0 && <span className="mt-0.5 block text-[10px] font-normal text-slate-500">{entry.referenceType}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{formatDate(entry.entryDate)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-800">{line.account.code} · {line.account.name}</td>
                  <td
                    className="max-w-[300px] px-4 py-3 text-xs text-slate-600"
                    title={getLineNarration(entry, line, lineIndex)}
                  >
                    <span className="block max-w-[300px] truncate cursor-help">
                      {getLineNarration(entry, line, lineIndex)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-slate-700">{line.direction === 'DEBIT' ? formatAmount(Number(line.amount)) : '—'}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-slate-700">{line.direction === 'CREDIT' ? formatAmount(Number(line.amount)) : '—'}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-medium text-orange-700">{entry.status}</span></td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        <DataTablePagination page={page} totalPages={totalPages} rowsPerPage={rowsPerPage} totalItems={filteredEntries.length} itemLabel="journal entries" onPageChange={setPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(1) }} />
      </div>
    </div>
  )
}

export default AdminJournalEntriesPage
