import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleDollarSign, RefreshCw, Search } from 'lucide-react'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { adminAccountingApi, type AccountingIncomeLine } from '../api/adminAccountingApi'

type IncomeRow = {
  id: string
  dateValue: string
  date: string
  reference: string
  account: string
  narration: string
  memo: string
  status: string
  amount: number
}

const formatDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const toIncomeRows = (entries: AccountingIncomeLine[]): IncomeRow[] =>
  entries
    .filter((line) => line.direction === 'CREDIT' && line.account.type === 'INCOME')
    .map((line) => ({
      id: line.id,
      dateValue: line.journalEntry.entryDate.slice(0, 10),
      date: formatDate(line.journalEntry.entryDate),
      reference: `${line.journalEntry.referenceType} · ${line.journalEntry.referenceId}`,
      account: `${line.account.code} · ${line.account.name}`,
      narration: line.journalEntry.narration ?? '—',
      memo: line.memo ?? '—',
      status: line.journalEntry.status,
      amount: Number(line.amount),
    }))

const AdminIncomePage = () => {
  const [entries, setEntries] = useState<IncomeRow[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const loadIncome = async () => {
    setStatus('loading')
    setError(null)
    try {
      const response = await adminAccountingApi.getIncomeEntries()
      setEntries(toIncomeRows(response.entries ?? []))
      setStatus('succeeded')
    } catch {
      setEntries([])
      setStatus('failed')
      setError('Unable to load income data from accounting-service.')
    }
  }

  useEffect(() => {
    void loadIncome()
  }, [])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return entries.filter((row) =>
      (!fromDate || row.dateValue >= fromDate) &&
      (!toDate || row.dateValue <= toDate) &&
      (!query || [row.reference, row.account, row.narration, row.memo, row.status].some((value) =>
        value.toLowerCase().includes(query),
      )),
    )
  }, [entries, fromDate, search, toDate])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
  const visibleRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const totalIncome = filteredRows.reduce((sum, row) => sum + row.amount, 0)

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <span>Accounting</span>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Income</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <CircleDollarSign size={22} className="text-emerald-600" />
            Income
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">Income journal lines recorded by accounting-service.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadIncome()}
          disabled={status === 'loading'}
          className="flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-xs text-emerald-700">Total income</p>
          <p className="mt-1 text-lg font-bold text-emerald-900">MMK {totalIncome.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">Income entries</p>
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
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500"
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
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            To
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => { setToDate(event.target.value); setPage(1) }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
            />
          </label>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => { setFromDate(''); setToDate(''); setPage(1) }}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
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
                {['Date', 'Reference', 'Account', 'Narration', 'Memo', 'Status', 'Amount'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-slate-600">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {status === 'loading' && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">Loading income entries...</td></tr>}
              {status !== 'loading' && status !== 'failed' && visibleRows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No income entries found.</td></tr>}
              {status !== 'loading' && visibleRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-4 text-xs text-slate-600">{row.date}</td>
                  <td className="px-4 py-4 text-xs font-medium text-slate-900">{row.reference}</td>
                  <td className="px-4 py-4 text-xs text-slate-700">{row.account}</td>
                  <td className="max-w-[220px] px-4 py-4 text-xs text-slate-600">{row.narration}</td>
                  <td className="max-w-[180px] px-4 py-4 text-xs text-slate-600">{row.memo}</td>
                  <td className="px-4 py-4"><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">{row.status}</span></td>
                  <td className="px-4 py-4 text-right text-xs font-semibold text-emerald-700">MMK {row.amount.toLocaleString()}</td>
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
          itemLabel="income entries"
          onPageChange={setPage}
          onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(1) }}
        />
      </div>
    </div>
  )
}

export default AdminIncomePage