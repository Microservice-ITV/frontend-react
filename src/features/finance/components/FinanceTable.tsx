import { useState } from 'react'
import { Search } from 'lucide-react'
import DataTablePagination from '@/components/ui/DataTablePagination'
import type {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../types/financeTypes'

type Props = {
  transactions: Transaction[]
  showSellerColumn?: boolean
}

const TYPE_STYLES: Record<TransactionType, string> = {
  income: 'bg-emerald-100 text-emerald-700',
  expense: 'bg-red-100 text-red-700',
}

const STATUS_STYLES: Record<TransactionStatus, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
}

const TYPE_FILTERS: { key: 'all' | TransactionType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expense' },
]

const FinanceTable = ({ transactions, showSellerColumn = false }: Props) => {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const hasDateFilter = dateFrom !== '' || dateTo !== ''

  const filtered = transactions.filter((t) => {
    const matchesType = typeFilter === 'all' || t.type === typeFilter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.amount.toLowerCase().includes(q)
    const matchesDate =
      (!dateFrom || t.dateValue >= dateFrom) &&
      (!dateTo || t.dateValue <= dateTo)
    return matchesType && matchesSearch && matchesDate
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated = filtered.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-900">
          Transactions
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-52">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none text-slate-600 focus:border-emerald-500"
              aria-label="Date from"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none text-slate-600 focus:border-emerald-500"
              aria-label="Date to"
            />
            {hasDateFilter && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                  setPage(1)
                }}
                className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {TYPE_FILTERS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setTypeFilter(tab.key)
                  setPage(1)
                }}
                className={`rounded px-2.5 py-1 text-xs font-medium ${
                  typeFilter === tab.key
                    ? 'bg-slate-200 text-slate-900'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">
                ID
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">
                Description
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">
                Category
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">
                Type
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">
                Status
              </th>
              <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">
                Date
              </th>
              <th className="px-2 py-2 text-right text-[11px] font-medium text-slate-500">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((t) => (
              <tr
                key={t.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-2 py-3 text-xs font-semibold text-slate-900">
                  {t.id}
                </td>
                <td className="px-2 py-3">
                  <p className="text-xs font-medium text-slate-900">
                    {t.description}
                  </p>
                  {t.reference && (
                    <p className="text-[11px] text-slate-500">{t.reference}</p>
                  )}
                </td>
                <td className="px-2 py-3 text-xs text-slate-600">
                  {t.category}
                </td>
                <td className="px-2 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${TYPE_STYLES[t.type]}`}
                  >
                    {t.type}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLES[t.status]}`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-2 py-3 text-xs text-slate-600">{t.date}</td>
                <td className="px-2 py-3 text-right text-xs font-semibold text-slate-900">
                  {t.amount}
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
        totalItems={filtered.length}
        itemLabel="transactions"
        onPageChange={setPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value)
          setPage(1)
        }}
      />
    </div>
  )
}

export default FinanceTable
