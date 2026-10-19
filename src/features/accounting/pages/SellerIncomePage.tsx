import { useEffect, useMemo, useState } from 'react' 
import { Link } from 'react-router-dom' 
import { CircleDollarSign, Download, RefreshCw, Search } from 'lucide-react' 
import * as XLSX from 'xlsx'
import DataTablePagination from '@/components/ui/DataTablePagination' 
import { authClient } from '@/lib/api/authClient' 
import { accountingClient } from '@/lib/api/accountingClient' 
import { useAppSelector } from '@/app/hooks' 
import type { AccountingIncomeLine } from '@/features/admin/api/adminAccountingApi' 
import {
  accountingReferenceKey,
  formatAccountingReferences,
} from '../utils/accountingReferenceFormatting'
 
type AccessContextResponse = { 
  data?: { 
    user?: {
      active_shop_id?: string | null
    }
    access_context?: { 
      active_shop?: {
        shop_id?: string | null
        shop_name?: string | null
      } | null
      shops?: Array<{ 
        shop_id?: string | null 
        shop_name?: string | null 
      }> 
    } 
  } 
} 
 
type IncomeRow = { 
  id: string 
  dateValue: string 
  date: string 
  reference: string 
  referenceType: string
  referenceId: string
  account: string 
  narration: string 
  memo: string 
  status: string 
  amount: number 
  shopId: string | null 
  shopName: string 
} 
 
const normalizeShopId = (value: string) => value.trim().toLowerCase() 
 
const formatDate = (value: string) => { 
  const date = new Date(value) 
  return Number.isNaN(date.getTime()) 
    ? '—' 
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
} 
 
const extractShopIdFromMemo = (value?: string | null): string | null => { 
  if (!value) return null 
  const match = value.match(/(?:^|[\s,(])shop(?:_id)?=([^,\s)]+)/i) 
  return match?.[1] ? match[1].trim() : null 
} 
 
export const toIncomeRows = ( 
  entries: AccountingIncomeLine[], 
  allowedShopIds: Set<string>, 
  shopNames: Record<string, string>, 
): IncomeRow[] => {
  const rows = entries 
    .filter((line) => line.direction === 'CREDIT' && line.account.type === 'INCOME') 
    .map((line) => { 
      const rawShopId = extractShopIdFromMemo(line.memo ?? line.journalEntry.narration) ?? extractShopIdFromMemo(line.journalEntry.narration) 
      const shopId = rawShopId ? normalizeShopId(rawShopId) : null 
      const fallbackShopId = allowedShopIds.size === 1 ? Array.from(allowedShopIds)[0] : null 
      const candidateShopId = shopId ?? fallbackShopId 
      const resolvedShopId = candidateShopId && allowedShopIds.has(candidateShopId) ? candidateShopId : null
 
      return { 
        id: line.id, 
        dateValue: line.journalEntry.entryDate.slice(0, 10), 
        date: formatDate(line.journalEntry.entryDate), 
        reference: '',
        referenceType: line.journalEntry.referenceType,
        referenceId: line.journalEntry.referenceId,
        account: `${line.account.code} · ${line.account.name}`, 
        narration: line.journalEntry.narration ?? '—', 
        memo: line.memo ?? '—', 
        status: line.journalEntry.status, 
        amount: Number(line.amount), 
        shopId: resolvedShopId, 
        shopName: resolvedShopId ? (shopNames[resolvedShopId] ?? 'Unknown shop') : '—', 
      } 
    }) 
    .filter((row) => { 
      if (!row.shopId) return false 
      return allowedShopIds.has(row.shopId) 
    }) 
  const formattedReferences = formatAccountingReferences(
    rows.map((row) => ({
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      date: row.dateValue,
    })),
  )

  return rows
    .map((row) => ({
      ...row,
      reference:
        formattedReferences.get(
          accountingReferenceKey({
            referenceType: row.referenceType,
            referenceId: row.referenceId,
            date: row.dateValue,
          }),
        ) ?? `${row.referenceType} · ${row.referenceId}`,
    }))
    .sort((left, right) => right.dateValue.localeCompare(left.dateValue))
}
 
const SellerIncomePage = () => { 
  const authUser = useAppSelector((state) => state.auth.user) 
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
      const [accessContextResponse, entriesResponse] = await Promise.all([ 
        authClient.get<AccessContextResponse>('/me/access-context'), 
        accountingClient.get<{ entries?: AccountingIncomeLine[]; totalIncome?: number | string }>('/reports/profit-loss'), 
      ]) 
 
      const accessContext = accessContextResponse.data.data?.access_context
      const activeShop = accessContext?.active_shop
      const shops = [
        ...(accessContext?.shops ?? []),
        ...(activeShop ? [activeShop] : []),
      ]
      const shopNames = Object.fromEntries( 
        shops.flatMap((shop) => 
          shop.shop_id && shop.shop_name ? [[normalizeShopId(shop.shop_id), shop.shop_name]] : [], 
        ), 
      ) 
      const contextShopId = accessContextResponse.data.data?.user?.active_shop_id
      const activeShopId = [activeShop?.shop_id, contextShopId, authUser?.active_shop_id]
        .find((shopId): shopId is string => typeof shopId === 'string' && shopId.trim() !== '')
      const normalizedActiveShopId = activeShopId ? normalizeShopId(activeShopId) : null
      const allowedShopIds = new Set<string>() 
 
      for (const shop of shops) { 
        if (shop.shop_id) allowedShopIds.add(normalizeShopId(shop.shop_id)) 
      } 
      if (normalizedActiveShopId) allowedShopIds.add(normalizedActiveShopId) 
 
      const safeEntries = entriesResponse.data?.entries ?? [] 
      const rows = toIncomeRows(safeEntries, allowedShopIds, shopNames) 
      setEntries(rows) 
      setStatus('succeeded') 
    } catch { 
      setEntries([]) 
      setStatus('failed') 
      setError('Unable to load income data for your shop.') 
    } 
  } 
 
  useEffect(() => { 
    void loadIncome() 
  }, [authUser?.id, authUser?.active_shop_id]) 
 
  const filteredRows = useMemo(() => { 
    const query = search.trim().toLowerCase() 
    return entries.filter((row) => 
      (!fromDate || row.dateValue >= fromDate) && 
      (!toDate || row.dateValue <= toDate) && 
      (!query || [row.reference, row.account, row.narration, row.memo, row.shopName, row.status].some((value) => value.toLowerCase().includes(query))), 
    ) 
  }, [entries, fromDate, search, toDate]) 
 
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage)) 
  const visibleRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage) 
  const totalIncome = filteredRows.reduce((sum, row) => sum + row.amount, 0) 
 
  const exportIncome = () => {
    const rows = [
      ['Date', 'Shop', 'Reference', 'Account', 'Narration', 'Memo', 'Status', 'Amount'],
      ...filteredRows.map((row) => [
        row.dateValue,
        row.shopName,
        row.reference,
        row.account,
        row.narration,
        row.memo,
        row.status,
        row.amount,
      ]),
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Seller Income')
    XLSX.writeFile(workbook, `seller-income-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }
 
  return ( 
    <div className="space-y-6"> 
      <nav className="text-xs text-slate-500"> 
        <Link to="/seller/overview" className="hover:text-slate-700">Dashboard</Link> 
        <span className="mx-1">/</span> 
        <span>Accounting</span> 
        <span className="mx-1">/</span> 
        <span className="text-slate-900">Income</span> 
      </nav> 
 
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"> 
        <div> 
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900"> 
            <CircleDollarSign size={22} className="text-emerald-600" /> 
            Related shop income 
          </h1> 
          <p className="mt-0.5 text-sm text-slate-600">Income journal lines for your shop only.</p> 
        </div> 
        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={exportIncome}
            disabled={filteredRows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Download size={14} />
            Export
          </button>
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
      </div> 
 
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>} 
 
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"> 
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
            placeholder="Search shop, reference, or memo..." 
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
                {['Date', 'Shop', 'Reference', 'Account', 'Narration', 'Memo', 'Status', 'Amount'].map((heading) => ( 
                  <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-slate-600">{heading}</th> 
                ))} 
              </tr> 
            </thead> 
            <tbody> 
              {status === 'loading' && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">Loading income entries...</td></tr>} 
              {status !== 'loading' && status !== 'failed' && visibleRows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">No related shop income found.</td></tr>} 
              {status !== 'loading' && visibleRows.map((row) => ( 
                <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50"> 
                  <td className="px-4 py-4 text-xs text-slate-600">{row.date}</td> 
                  <td className="px-4 py-4 text-xs font-medium text-slate-900">{row.shopName}</td> 
                  <td className="max-w-[180px] px-4 py-4 text-xs font-medium text-slate-900"> 
                    <span title={row.reference} className="block truncate">{row.reference}</span> 
                  </td> 
                  <td className="px-4 py-4 text-xs text-slate-700">{row.account}</td> 
                  <td className="max-w-[220px] px-4 py-4 text-xs text-slate-600 truncate" title={row.narration}>{row.narration}</td> 
                  
                  {/* Styled Memo Cell */}
                  <td className="px-4 py-4 text-xs text-slate-600"> 
                    {row.memo !== '—' ? ( 
                      <span 
                        title={row.memo} 
                        className="inline-block max-w-[160px] truncate rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700" 
                      > 
                        {row.memo} 
                      </span> 
                    ) : ( 
                      <span className="text-slate-400">—</span> 
                    )} 
                  </td> 

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
 
export default SellerIncomePage