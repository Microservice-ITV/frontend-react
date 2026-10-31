import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CircleAlert,
  Coins,
  RefreshCw,
  Scale,
  UserRound,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { authClient } from '@/lib/api/authClient'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { accountingArApAdapter } from '../adapters/accountingArApAdapter'
import {
  accountingReferenceKey,
  formatAccountingReferences,
  type AccountingReferenceInput,
} from '../utils/accountingReferenceFormatting'
import type {
  ArApAccountBalance,
  ArApAgingResponse,
  ArApSummaryResponse,
  ArApTransaction,
  ArApTransactionsResponse,
} from '../types/arApTypes'

type Shop = { shop_id?: string | null; shop_name?: string | null }
type AccessContextResponse = {
  data?: {
    access_context?: {
      active_shop?: Shop | null
      shops?: Shop[]
    }
  }
}
type LoadStatus = 'loading' | 'succeeded' | 'failed'
type FinanceScope = { shops: Shop[]; ready: boolean }
type MetricKey = 'receivables' | 'codClearing' | 'deferredRevenue' | 'account1010Debits' | 'payables'
type CurrencyMetric = { currency: string | null; value: number }

const money = (value: number, currency: string | null) => {
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return currency ? `${currency} ${formatted}` : `Currency unavailable · ${formatted}`
}

const errorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: unknown } } }).response
    if (typeof response?.data?.error === 'string') return response.data.error
    const status = (error as { response?: { status?: number } }).response?.status
    if (status === 401) return 'Your session has expired. Sign in again to view finance data.'
    if (status === 403) return 'You are not authorized to view this shop’s accounting data.'
  }
  return error instanceof Error && error.message
    ? error.message
    : 'Unable to load AR/AP accounting data.'
}

const groupValuesByCurrency = (
  rows: ArApAccountBalance[],
  include: (row: ArApAccountBalance) => boolean,
) => {
  const grouped = new Map<string, CurrencyMetric>()
  rows.filter(include).forEach((row) => {
    const key = row.currency ?? ''
    const previous = grouped.get(key)
    grouped.set(key, {
      currency: row.currency,
      value: (previous?.value ?? 0) + row.balance,
    })
  })
  return [...grouped.values()].sort((left, right) =>
    String(left.currency ?? '').localeCompare(String(right.currency ?? '')),
  )
}

export const buildArApMetricGroups = (summary: ArApSummaryResponse): Record<MetricKey, CurrencyMetric[]> => ({
  receivables: groupValuesByCurrency(
    summary.accountBalances,
    (row) => row.accountCode === '1100' || row.accountCode === '1200',
  ),
  codClearing: groupValuesByCurrency(
    summary.codCollectionClearing.balanceRows,
    () => true,
  ),
  deferredRevenue: groupValuesByCurrency(
    summary.accountBalances,
    (row) => row.accountCode === '2200',
  ),
  account1010Debits: (() => {
    const grouped = new Map<string, CurrencyMetric>()
    summary.recordedReceipts.forEach((receipt) => {
      const key = receipt.currency ?? ''
      const previous = grouped.get(key)
      grouped.set(key, {
        currency: receipt.currency,
        value: (previous?.value ?? 0) + receipt.amount,
      })
    })
    return [...grouped.values()].sort((left, right) =>
      String(left.currency ?? '').localeCompare(String(right.currency ?? '')),
    )
  })(),
  payables: groupValuesByCurrency(summary.payables.accountBalances, () => true),
})

const getTransactionDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
}

const authorizedShops = (shops: Shop[]) => {
  const unique = new Map<string, Shop>()
  shops.forEach((shop) => {
    const shopId = shop.shop_id?.trim()
    if (shopId) unique.set(shopId, { ...shop, shop_id: shopId })
  })
  return [...unique.values()]
}

const referenceIdentity = (reference: Pick<AccountingReferenceInput, 'referenceType' | 'referenceId'>) =>
  `${reference.referenceType}\u0000${reference.referenceId}`

const MetricCard = ({
  title,
  detail,
  values,
  tone,
  icon: Icon,
}: {
  title: string
  detail: string
  values: CurrencyMetric[]
  icon: LucideIcon
  tone: 'emerald' | 'blue' | 'amber' | 'violet'
}) => (
  <article className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
    <div className="flex items-start gap-3">
      <span className={`rounded-full p-2.5 ${{
        emerald: 'bg-emerald-50 text-emerald-700',
        blue: 'bg-blue-50 text-blue-700',
        amber: 'bg-amber-50 text-amber-700',
        violet: 'bg-violet-50 text-violet-700',
      }[tone]}`}>
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-xs font-semibold text-slate-600">{title}</h3>
        {values.length ? (
          <ul className="mt-1.5 space-y-1">
            {values.map((item) => (
              <li key={item.currency ?? 'unknown'} className="text-base font-bold text-slate-900">
                {money(item.value, item.currency)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-sm font-semibold text-slate-500">Unavailable</p>
        )}
        <p className="mt-1.5 text-[10px] leading-4 text-slate-500">{detail}</p>
      </div>
    </div>
  </article>
)

const ExceptionCard = ({ count }: { count: number }) => (
  <article className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
    <div className="flex items-start gap-3">
      <span className="rounded-full bg-orange-50 p-2.5 text-orange-600">
        <CircleAlert size={17} />
      </span>
      <div>
        <h3 className="text-xs font-semibold text-slate-600">Unclassified / Needs Review</h3>
        <p className="mt-1.5 text-base font-bold text-slate-900">
          {count} {count === 1 ? 'record' : 'records'}
        </p>
        <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
          Journal lines missing shop or currency attribution.
        </p>
      </div>
    </div>
  </article>
)

const StatusBadge = ({ status }: { status: string }) => {
  const label = ({
    OPEN: 'Open',
    PARTIALLY_CLEARED_IN_GL: 'Partially cleared in ledger',
    CLEARED_FROM_RECEIVABLE_NOT_PROOF_OF_PAYMENT: 'Cleared in ledger · not proof of payment',
    CREDIT_BALANCE_REQUIRES_REVIEW: 'Credit balance · review',
    NO_OPEN_BALANCE: 'No open ledger balance',
  } as Record<string, string>)[status] ?? status.toLowerCase().replaceAll('_', ' ')
  const tone = status === 'OPEN'
    ? 'bg-emerald-50 text-emerald-700'
    : status.includes('REVIEW')
      ? 'bg-orange-50 text-orange-700'
      : status.includes('PARTIALLY')
        ? 'bg-blue-50 text-blue-700'
        : 'bg-slate-100 text-slate-600'

  return (
    <span className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-[10px] font-medium leading-4 ${tone}`}>
      {label}
    </span>
  )
}

const ReceivablesPanel = ({
  items,
  onSelectReference,
  formattedReferences,
}: {
  items: ArApSummaryResponse['receivableItems']
  onSelectReference: (reference: { referenceType: string; referenceId: string }) => void
  formattedReferences: Map<string, string>
}) => {
  const columns: DataTableColumn<ArApSummaryResponse['receivableItems'][number]>[] = [
    {
      key: 'source',
      header: 'Customer / Source',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">
            {item.orderId ? `Order ${item.orderId}` : 'Order reference unavailable'}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">Customer identity unavailable</p>
        </div>
      ),
    },
    { key: 'dueDate', header: 'Due date', render: () => <span className="text-slate-400">Unavailable</span> },
    { key: 'currency', header: 'Currency', render: (item) => item.currency ?? 'Unavailable' },
    {
      key: 'outstanding',
      header: 'Outstanding',
      align: 'right',
      sortValue: (item) => item.outstandingBalance,
      render: (item) => <span className="whitespace-nowrap font-medium">{money(item.outstandingBalance, item.currency)}</span>,
    },
    { key: 'status', header: 'Ledger status', render: (item) => <StatusBadge status={item.status} /> },
    {
      key: 'reference',
      header: 'Reference',
      render: (item) => (
        <div className="max-w-48 space-y-1">
          {item.sourceReferences.length
            ? item.sourceReferences.map((reference) => (
              <button
                key={`${reference.referenceType}-${reference.referenceId}`}
                type="button"
                title={`${reference.referenceType} · ${reference.referenceId}`}
                onClick={() => onSelectReference(reference)}
                className="block max-w-full truncate text-left text-xs font-medium text-slate-800 hover:text-emerald-700"
              >
                {formattedReferences.get(referenceIdentity(reference)) ?? `${reference.referenceType} · ${reference.referenceId}`}
              </button>
            ))
            : <span className="text-slate-400">Unavailable</span>}
        </div>
      ),
    },
  ]

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="rounded-full bg-emerald-50 p-2 text-emerald-700"><UserRound size={16} /></span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">Accounts Receivable</h2>
            <p className="mt-0.5 text-[10px] text-slate-500">Customer payments and outstanding receivables.</p>
          </div>
        </div>
        <span className="text-[10px] text-slate-500">{items.length} ledger items</span>
      </div>
      <DataTable
        columns={columns}
        rows={items}
        rowKey={(item, index) => `${item.accountCode}-${item.shopId}-${item.currency}-${item.orderId}-${index}`}
        emptyMessage="No receivable source items are available for this scope."
        itemLabel="receivables"
        initialRowsPerPage={5}
        minWidth="900px"
      />
      <p className="border-t border-slate-100 px-3 py-2 text-[10px] text-slate-500">
        Due dates and customer names are not available in the verified Accounting data.
      </p>
    </section>
  )
}

const PayablesPanel = ({ balances }: { balances: ArApAccountBalance[] }) => {
  const columns: DataTableColumn<ArApAccountBalance>[] = [
    {
      key: 'account',
      header: 'Account / Ledger basis',
      render: (balance) => (
        <div>
          <p className="font-semibold text-slate-800">{balance.accountCode} · {balance.accountName}</p>
          <p className="mt-1 text-[10px] text-slate-500">{balance.balanceMeaning.replaceAll('_', ' ')}</p>
        </div>
      ),
    },
    { key: 'dueDate', header: 'Due date', render: () => <span className="text-slate-400">Unavailable</span> },
    { key: 'currency', header: 'Currency', render: (balance) => balance.currency ?? 'Unavailable' },
    {
      key: 'balance',
      header: 'Amount',
      align: 'right',
      sortValue: (balance) => balance.balance,
      render: (balance) => <span className="whitespace-nowrap font-medium">{money(balance.balance, balance.currency)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <StatusBadge status="LEDGER_LIABILITY" />,
    },
    {
      key: 'reference',
      header: 'Reference',
      render: () => <span className="text-slate-400">Not provided</span>,
    },
    {
      key: 'action',
      header: 'Action',
      render: () => <span className="text-slate-400">—</span>,
    },
  ]

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="rounded-full bg-blue-50 p-2 text-blue-700"><Wallet size={16} /></span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Accounts Payable</h2>
            <p className="mt-0.5 text-[10px] text-slate-500">Supplier invoices and outstanding payables are not independently available.</p>
          </div>
        </div>
        <span className="text-[10px] text-slate-500">{balances.length} ledger balances</span>
      </div>
      <DataTable
        columns={columns}
        rows={balances}
        rowKey={(balance) => `${balance.accountCode}-${balance.shopId}-${balance.currency}`}
        emptyMessage="No supported payable control-account balances were returned."
        itemLabel="liabilities"
        initialRowsPerPage={5}
        minWidth="980px"
      />
      <p className="border-t border-slate-100 px-3 py-2 text-[10px] text-slate-500">
        Ledger liabilities only. Supplier identity, invoice dates, due dates, and payable references are not provided by this report.
      </p>
    </section>
  )
}

const AgingPanel = ({ aging }: { aging: ArApAgingResponse | null }) => {
  const buckets = aging?.buckets
  const validBuckets = aging?.available === true
    && buckets !== null
    && buckets !== undefined
    && !Array.isArray(buckets)
    && Object.keys(buckets).length > 0
    && Object.values(buckets).every((value) => Number.isFinite(value) && value >= 0)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-900">Aging</h3>
      {validBuckets ? (
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(buckets!).map(([bucket, value]) => (
            <div key={bucket} className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">{bucket}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-2 text-sm text-slate-600">
          {aging?.reason ?? 'Aging is unavailable because the API does not provide verified aging data or due dates.'}
        </p>
      )}
    </section>
  )
}

const TransactionDetails = ({
  detail,
  loading,
  error,
  onClose,
}: {
  detail: ArApTransaction[] | null
  loading: boolean
  error: string | null
  onClose: () => void
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3 sm:p-6"
    role="presentation"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}
  >
    <section
      className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ar-ap-detail-title"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 id="ar-ap-detail-title" className="text-base font-semibold text-slate-900">
          Journal details
        </h3>
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
          Close
        </button>
      </div>
      {loading && <p className="py-8 text-sm text-slate-600">Loading journal details…</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && detail?.map((transaction) => (
        <article key={transaction.journalId} className="mt-4 border-t border-slate-100 pt-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Reference</dt><dd className="break-all font-medium">{transaction.referenceType} · {transaction.referenceId}</dd></div>
            <div><dt className="text-slate-500">Status</dt><dd className="font-medium">{transaction.status}</dd></div>
            <div><dt className="text-slate-500">Date</dt><dd className="font-medium">{getTransactionDate(transaction.entryDate)}</dd></div>
            <div><dt className="text-slate-500">Narration</dt><dd className="font-medium">{transaction.narration ?? 'Not provided'}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-amber-700">
            {transaction.journalCompleteness === 'AUTHORIZED_SHOP_LINES_ONLY'
              ? 'Only journal lines attributed to your authorized shop scope are shown.'
              : 'Full journal lines are shown for this authorized scope.'}
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-500">
                <tr><th className="px-2 py-2">Account</th><th className="px-2 py-2">Shop</th><th className="px-2 py-2">Debit</th><th className="px-2 py-2">Credit</th><th className="px-2 py-2">Source detail</th></tr>
              </thead>
              <tbody>
                {transaction.lines.map((line, index) => (
                  <tr key={`${line.accountCode}-${line.shopId}-${line.direction}-${index}`} className="border-b border-slate-50">
                    <td className="px-2 py-2">{line.accountCode} · {line.accountName}</td>
                    <td className="px-2 py-2">{line.shopId ?? '—'}</td>
                    <td className="px-2 py-2">{line.direction === 'DEBIT' ? money(line.amount, line.currency) : '—'}</td>
                    <td className="px-2 py-2">{line.direction === 'CREDIT' ? money(line.amount, line.currency) : '—'}</td>
                    <td className="px-2 py-2">{line.memo ?? transaction.narration ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </section>
  </div>
)

const SellerReceivablesPayablesReport = () => {
  const [scope, setScope] = useState<FinanceScope>({ shops: [], ready: false })
  const [selectedShopId, setSelectedShopId] = useState('')
  const [currency, setCurrency] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [summary, setSummary] = useState<ArApSummaryResponse | null>(null)
  const [transactions, setTransactions] = useState<ArApTransactionsResponse | null>(null)
  const [aging, setAging] = useState<ArApAgingResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedReference, setSelectedReference] = useState<Pick<ArApTransaction, 'referenceType' | 'referenceId'> | null>(null)
  const [detail, setDetail] = useState<ArApTransaction[] | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void authClient.get<AccessContextResponse>('/me/access-context')
      .then((response) => {
        if (!active) return
        const context = response.data.data?.access_context
        const shops = authorizedShops(context?.shops ?? [])
        const activeShopId = context?.active_shop?.shop_id?.trim() ?? ''
        const defaultShopId = shops.some((shop) => shop.shop_id === activeShopId)
          ? activeShopId
          : shops.length === 1
            ? shops[0]?.shop_id ?? ''
            : ''
        setScope({ shops, ready: true })
        setSelectedShopId(defaultShopId)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(errorMessage(cause))
        setStatus('failed')
        setScope({ shops: [], ready: false })
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!scope.ready) return
    let active = true
    const params = {
      ...(selectedShopId ? { shopId: selectedShopId } : {}),
      ...(currency ? { currency } : {}),
    }
    setStatus('loading')
    setError(null)
    void Promise.all([
      accountingArApAdapter.getSummary(params),
      accountingArApAdapter.listTransactions({
        ...params,
        limit: 200,
        offset: 0,
      }),
      accountingArApAdapter.getAging(selectedShopId ? { shopId: selectedShopId } : {}),
    ])
      .then(([nextSummary, nextTransactions, nextAging]) => {
        if (!active) return
        setSummary(nextSummary)
        setTransactions(nextTransactions)
        setAging(nextAging)
        setStatus('succeeded')
      })
      .catch((cause: unknown) => {
        if (!active) return
        setSummary(null)
        setTransactions(null)
        setAging(null)
        setStatus('failed')
        setError(errorMessage(cause))
      })
    return () => { active = false }
  }, [currency, refreshKey, scope.ready, selectedShopId])

  useEffect(() => {
    if (!selectedReference) return
    let active = true
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)
    void accountingArApAdapter.getTransaction(
      selectedReference.referenceType,
      selectedReference.referenceId,
      selectedShopId ? { shopId: selectedShopId } : {},
    )
      .then((result) => {
        if (active) setDetail(result)
      })
      .catch((cause: unknown) => {
        if (active) setDetailError(errorMessage(cause))
      })
      .finally(() => {
        if (active) setDetailLoading(false)
      })
    return () => { active = false }
  }, [selectedReference, selectedShopId])

  const metricGroups = useMemo(
    () => summary ? buildArApMetricGroups(summary) : null,
    [summary],
  )
  const currencyOptions = useMemo(() => {
    if (!summary) return []
    return [...new Set([
      ...summary.accountBalances.map((row) => row.currency),
      ...summary.recordedReceipts.map((row) => row.currency),
    ].filter((value): value is string => Boolean(value)))].sort()
  }, [summary])
  const formattedReferences = useMemo(() => {
    if (!summary || !transactions) return new Map<string, string>()
    const transactionDates = new Map<string, string>()
    transactions.transactions.forEach((transaction) => {
      transactionDates.set(
        referenceIdentity(transaction),
        transaction.entryDate.slice(0, 10),
      )
    })
    const references: AccountingReferenceInput[] = summary.receivableItems.flatMap((item) =>
      item.sourceReferences.flatMap((reference) => {
        const date = transactionDates.get(referenceIdentity(reference))
        return date ? [{ ...reference, date }] : []
      }),
    )
    const formatted = formatAccountingReferences(references)
    return new Map(
      references.map((reference) => [
        referenceIdentity(reference),
        formatted.get(accountingReferenceKey(reference)) ?? `${reference.referenceType} · ${reference.referenceId}`,
      ]),
    )
  }, [summary, transactions])

  return (
    <section className="space-y-4" aria-labelledby="ar-ap-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-lg border border-slate-200 bg-white p-2 text-blue-700 shadow-sm">
            <Scale size={20} />
          </span>
          <div>
            <h1 id="ar-ap-title" className="text-xl font-bold tracking-tight text-slate-900">
              Accounts Receivable / Accounts Payable
            </h1>
            <p className="mt-0.5 max-w-3xl text-xs text-slate-500">
              Review receivable balances, posted liabilities, and COD clearing.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={status === 'loading'}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-2.5">
        {summary && (
          <div className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] text-slate-600">
            <CalendarDays size={14} className="text-slate-500" />
            <span>As of {getTransactionDate(summary.asOf)}</span>
          </div>
        )}
        {scope.shops.length > 1 && (
          <label className="grid min-w-40 gap-1 text-[10px] font-medium text-slate-500">
            Shop
            <select
              aria-label="AR/AP shop"
              value={selectedShopId}
              onChange={(event) => setSelectedShopId(event.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
            >
              <option value="">All authorized shops</option>
              {scope.shops.map((shop) => (
                <option key={shop.shop_id} value={shop.shop_id!}>
                  {shop.shop_name ?? shop.shop_id}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="grid min-w-32 gap-1 text-[10px] font-medium text-slate-500">
          Currency
          <select
            aria-label="AR/AP currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
          >
            <option value="">All currencies</option>
            {currencyOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {status === 'loading' && (
        <div role="status" aria-label="Loading AR/AP data" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-lg bg-slate-200" />)}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-56 animate-pulse rounded-lg bg-slate-200" />)}
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
          AR/AP data could not be loaded. Use Refresh to try again.
        </div>
      )}

      {status === 'succeeded' && summary && metricGroups && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              title="Accounts Receivable"
              values={metricGroups.receivables}
              detail="Posted balances in receivable control accounts."
              tone="emerald"
              icon={UserRound}
            />
            <MetricCard
              title="Accounts Payable"
              values={metricGroups.payables}
              detail="Ledger liabilities; not confirmed supplier invoices."
              tone="blue"
              icon={Wallet}
            />
            <MetricCard
              title="COD Clearing"
              values={metricGroups.codClearing}
              detail="Account 1210, separate from receivables."
              tone="violet"
              icon={Coins}
            />
            <MetricCard
              title="Deferred COD Revenue"
              values={metricGroups.deferredRevenue}
              detail="Revenue not recognized until COD is collected."
              tone="amber"
              icon={Scale}
            />
            <ExceptionCard count={summary.missingAttribution.length} />
          </div>

          <div className="space-y-4">
            <ReceivablesPanel
              items={summary.receivableItems}
              onSelectReference={setSelectedReference}
              formattedReferences={formattedReferences}
            />
            <PayablesPanel balances={summary.payables.accountBalances} />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-900">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p>{summary.codCollectionClearing.evidenceNote}</p>
              <p>
                Account 1010 debit movements: {metricGroups.account1010Debits.length
                  ? metricGroups.account1010Debits.map((item) => money(item.value, item.currency)).join(' · ')
                  : 'Unavailable'}
                {' '}— posted ledger movements, not independently verified bank deposits.
              </p>
              <p>{summary.payables.note}</p>
            </div>
          </div>

          <AgingPanel aging={aging} />
        </>
      )}

      {selectedReference && (
        <TransactionDetails
          detail={detail}
          loading={detailLoading}
          error={detailError}
          onClose={() => {
            setSelectedReference(null)
            setDetail(null)
          }}
        />
      )}
    </section>
  )
}

export default SellerReceivablesPayablesReport
