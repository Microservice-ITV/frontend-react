import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Ban,
  CalendarDays,
  Clock3,
  CreditCard,
  Download,
  DollarSign,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  X,
} from 'lucide-react'
import DataTablePagination from '@/components/ui/DataTablePagination'
import AdminInvoiceActionModal from '../components/AdminInvoiceActionModal'
import AdminInvoiceAuditDrawer from '../components/AdminInvoiceAuditDrawer'
import AdminInvoiceBatchBar from '../components/AdminInvoiceBatchBar'
import {
  getAllAdminInvoices,
  generateInvoicePdf,
  voidInvoice,
  type InvoiceDocument,
  type InvoiceStatus,
} from '@/lib/api/invoiceClient'

type ActionType = 'audit' | 'void' | 'refund'

type StatusFilter = 'ALL' | InvoiceStatus

const ROWS_PER_PAGE = 10

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  UNPAID: 'Unpaid',
  PENDING_VERIFICATION: 'Pending verification',
  PAID: 'Paid',
  REJECTED: 'Rejected',
  VOID: 'Void',
  REFUNDED: 'Refunded',
}

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  UNPAID: 'bg-slate-100 text-slate-700',
  PENDING_VERIFICATION: 'border border-amber-200 bg-amber-50 text-amber-800',
  PAID: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border border-red-200 bg-red-50 text-red-700',
  VOID: 'border border-zinc-300 bg-zinc-100 text-zinc-700',
  REFUNDED: 'border border-blue-200 bg-blue-50 text-blue-700',
}

const formatMoney = (invoice: InvoiceDocument) =>
  Number(invoice.grandTotal).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const formatDate = (date: string) =>
  new Date(date).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

const getDisplayValue = (value: string | null | undefined, fallback: string) =>
  value && value.trim().length > 0 ? value.trim() : fallback

const AdminInvoicesPage = () => {
  const [invoices, setInvoices] = useState<InvoiceDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [shopFilter, setShopFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<ActionType | null>(null)
  const [actionInvoice, setActionInvoice] = useState<InvoiceDocument | null>(null)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([])
  const [voidReason, setVoidReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const loadInvoices = async () => {
    setIsLoading(true)
    setError(null)
    try {
      setInvoices(await getAllAdminInvoices())
    } catch {
      setError('Unable to load invoices.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadInvoices()
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeoutId = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const shopOptions = useMemo(
    () => {
      const uniqueShops = new Map<string, { id: string; name: string }>()

      invoices.forEach((invoice) => {
        const shopId = invoice.shopId
        if (!uniqueShops.has(shopId)) {
          uniqueShops.set(shopId, {
            id: shopId,
            name: getDisplayValue(invoice.shopName, 'N/A'),
          })
        }
      })

      return [
        { value: 'ALL', label: 'All shops' },
        ...Array.from(uniqueShops.values())
          .sort((left, right) => left.name.localeCompare(right.name))
          .map((shop) => ({ value: shop.id, label: shop.name })),
      ]
    },
    [invoices],
  )

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase()
    return invoices.filter((invoice) => {
      const matchesSearch =
        !query ||
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.orderId.toLowerCase().includes(query)
      const createdAt = new Date(invoice.createdAt)
      const matchesFrom = !fromDate || createdAt >= new Date(`${fromDate}T00:00:00`)
      const matchesTo = !toDate || createdAt <= new Date(`${toDate}T23:59:59.999`)
      return (
        matchesSearch &&
        (shopFilter === 'ALL' || invoice.shopId === shopFilter) &&
        (statusFilter === 'ALL' || invoice.status === statusFilter) &&
        matchesFrom &&
        matchesTo
      )
    })
  }, [fromDate, invoices, search, shopFilter, statusFilter, toDate])

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / rowsPerPage))
  const pageInvoices = filteredInvoices.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const totalRevenue = invoices.reduce((sum, invoice) => {
    if (invoice.status === 'PAID') {
      return sum + Number(invoice.grandTotal)
    }

    if (invoice.status === 'REFUNDED') {
      return sum - Number(invoice.refundAmount ?? invoice.grandTotal)
    }

    return sum
  }, 0)
  const refundedCount = invoices.filter(
    (invoice) => invoice.status === 'VOID' || invoice.status === 'REFUNDED',
  ).length
  const pendingCount = invoices.filter((invoice) => invoice.status === 'PENDING_VERIFICATION').length
  const revenueCurrency = invoices[0]?.currency ?? 'USD'

  const resetPage = () => setPage(1)

  const openAction = (invoice: InvoiceDocument, action: ActionType) => {
    setActionInvoice(invoice)
    setActiveAction(action)
    setOpenMenuId(null)
    setVoidReason('')
  }

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoiceIds((current) => current.includes(invoiceId)
      ? current.filter((id) => id !== invoiceId)
      : [...current, invoiceId])
  }

  const clearSelectedInvoices = () => {
    setSelectedInvoiceIds([])
  }

  const closeAction = () => {
    if (isSubmitting) return
    setActionInvoice(null)
    setActiveAction(null)
    setVoidReason('')
  }

  const handleVoid = async () => {
    if (!actionInvoice || !voidReason.trim()) return
    setIsSubmitting(true)
    try {
      const updated = await voidInvoice(actionInvoice.id, voidReason.trim())
      setInvoices((current) => current.map((invoice) => invoice.id === updated.id ? updated : invoice))
      setIsSubmitting(false)
      closeAction()
    } catch {
      setError('Unable to void this invoice.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGeneratePdf = async (invoice: InvoiceDocument) => {
    if (generatingPdfId) return

    setGeneratingPdfId(invoice.id)
    setOpenMenuId(null)
    try {
      const generatedInvoice = await generateInvoicePdf(invoice.id)
      setInvoices((current) =>
        current.map((item) => (item.id === generatedInvoice.id ? generatedInvoice : item)),
      )
      setToast({ tone: 'success', message: 'Invoice PDF generated successfully.' })

      if (generatedInvoice.pdfUrl) {
        window.open(generatedInvoice.pdfUrl, '_blank', 'noopener,noreferrer')
      } else {
        setToast({ tone: 'success', message: 'PDF generation started. Refresh when it is ready.' })
      }
    } catch (requestError: unknown) {
      const message = (
        requestError as { response?: { data?: { message?: string } } }
      ).response?.data?.message ?? 'Unable to generate invoice PDF.'
      setToast({ tone: 'error', message })
    } finally {
      setGeneratingPdfId(null)
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">Dashboard</Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Invoices</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <FileText size={22} className="text-slate-400" />
             Invoices
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">Monitor invoice activity and payment verification across every shop.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadInvoices()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={<FileText size={18} />} label="Total platform invoices" value={invoices.length.toLocaleString()} tone="indigo" />
        <SummaryCard icon={<DollarSign size={18} />} label="Net revenue" value={`${revenueCurrency} ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} tone="emerald" />
        <SummaryCard icon={<Clock3 size={18} />} label="Global pending verifications" value={pendingCount.toLocaleString()} tone="amber" />
        <SummaryCard icon={<AlertTriangle size={18} />} label="Voided / refunded count" value={refundedCount.toLocaleString()} tone="rose" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.5fr)_1fr_1fr_1fr]">
          <label className="relative block">
            <span className="sr-only">Search invoice or order ID</span>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); resetPage() }} placeholder="Search invoice # or order ID" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:bg-white" />
          </label>
          <FilterSelect label="Shop" value={shopFilter} onChange={(value) => { setShopFilter(value); resetPage() }} options={shopOptions} />
          <FilterSelect label="Status" value={statusFilter} onChange={(value) => { setStatusFilter(value as StatusFilter); resetPage() }} options={[{ value: 'ALL', label: 'All statuses' }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))]} />
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="shrink-0 text-slate-400" />
            <label className="min-w-0 flex-1"><span className="sr-only">From date</span><input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => { setFromDate(event.target.value); resetPage() }} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500" /></label>
            <span className="text-xs text-slate-400">to</span>
            <label className="min-w-0 flex-1"><span className="sr-only">To date</span><input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => { setToDate(event.target.value); resetPage() }} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500" /></label>
          </div>
        </div>
      </div>

      {error && <div role="alert" className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X size={16} /></button></div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-270">
            <thead><tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600"><input type="checkbox" aria-label="Select all invoices" checked={pageInvoices.length > 0 && pageInvoices.every((invoice) => selectedInvoiceIds.includes(invoice.id))} onChange={() => {
                const allSelected = pageInvoices.every((invoice) => selectedInvoiceIds.includes(invoice.id))
                setSelectedInvoiceIds((current) => {
                  const next = new Set(current)
                  pageInvoices.forEach((invoice) => {
                    if (allSelected) {
                      next.delete(invoice.id)
                    } else {
                      next.add(invoice.id)
                    }
                  })
                  return [...next]
                })
              }} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /></th>
              {['Invoice #', 'Shop name / ID', 'Customer', 'Grand total', 'Payment status', 'Created at', 'Actions'].map((heading) => <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-slate-600">{heading}</th>)}
            </tr></thead>
            <tbody>
              {isLoading && <InvoiceSkeletonRows />}
              {!isLoading && pageInvoices.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">No invoices found for the current filters.</td></tr>}
              {!isLoading && pageInvoices.map((invoice) => <tr key={invoice.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-4"><input type="checkbox" aria-label={`Select invoice ${invoice.invoiceNumber || invoice.id}`} checked={selectedInvoiceIds.includes(invoice.id)} onChange={() => toggleInvoiceSelection(invoice.id)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /></td>
                <td className="px-4 py-4"><p className="font-mono text-xs font-semibold text-slate-900">{invoice.invoiceNumber || invoice.id}</p><p className="mt-1 text-[11px] text-slate-400">Order {invoice.orderId.slice(0, 12)}</p></td>
                <td className="px-4 py-4"><div className="flex items-start gap-2"><Store size={15} className="mt-0.5 text-slate-400" /><div><p className="text-xs font-medium text-slate-800">{getDisplayValue(invoice.shopName, 'N/A')}</p><p className="mt-1 text-[11px] text-slate-400">{invoice.shopId}</p></div></div></td>
                <td className="px-4 py-4"><div className="flex items-start gap-2"><ShieldCheck size={15} className="mt-0.5 text-slate-400" /><div><p className="text-xs font-medium text-slate-800">{getDisplayValue(invoice.customerName, 'N/A')}</p><p className="mt-1 text-[11px] text-slate-400">{getDisplayValue(invoice.customerEmail, 'N/A')}</p></div></div></td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatMoney(invoice)}</td>
                <td className="whitespace-nowrap px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold leading-none ${STATUS_STYLES[invoice.status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{STATUS_LABELS[invoice.status]}</span></td>
                <td className="px-4 py-4 text-xs text-slate-600">{formatDate(invoice.createdAt)}</td>
                <td className="px-4 py-4"><div className="relative" ref={openMenuId === invoice.id ? menuRef : undefined}><button type="button" aria-label={`Actions for ${invoice.invoiceNumber || invoice.id}`} onClick={() => setOpenMenuId(openMenuId === invoice.id ? null : invoice.id)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><MoreHorizontal size={18} /></button>{openMenuId === invoice.id && <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"><ActionButton icon={<Eye size={14} />} label="View audit details" onClick={() => openAction(invoice, 'audit')} />{invoice.pdfUrl && <ActionButton icon={<Download size={14} />} label="Download PDF" onClick={() => { window.open(invoice.pdfUrl as string, '_blank', 'noopener,noreferrer'); setOpenMenuId(null) }} />}<ActionButton icon={generatingPdfId === invoice.id ? <Loader2 size={14} className="animate-spin" /> : invoice.pdfUrl ? <RefreshCw size={14} /> : <FileText size={14} />} label={generatingPdfId === invoice.id ? 'Generating PDF...' : invoice.pdfUrl ? 'Re-generate PDF' : 'Generate PDF'} disabled={generatingPdfId !== null} onClick={() => void handleGeneratePdf(invoice)} /><ActionButton icon={<Ban size={14} />} label="Force void" disabled={invoice.status === 'VOID' || invoice.status === 'REFUNDED'} onClick={() => openAction(invoice, 'void')} /><ActionButton icon={<CreditCard size={14} />} label="Process refund" disabled={invoice.status !== 'PAID'} onClick={() => openAction(invoice, 'refund')} /></div>}</div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {!isLoading && <DataTablePagination page={page} totalPages={totalPages} rowsPerPage={rowsPerPage} totalItems={filteredInvoices.length} onPageChange={setPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(1) }} itemLabel="invoices" />}
      </div>

      <AdminInvoiceAuditDrawer
        invoice={actionInvoice}
        isOpen={Boolean(actionInvoice && activeAction === 'audit')}
        onClose={closeAction}
      />
      <AdminInvoiceActionModal
        invoice={actionInvoice}
        actionType={activeAction === 'refund' ? 'REFUND' : 'VOID'}
        isOpen={Boolean(actionInvoice && (activeAction === 'void' || activeAction === 'refund'))}
        onClose={closeAction}
        onSuccess={() => void loadInvoices()}
      />
      <AdminInvoiceBatchBar
        selectedInvoiceIds={selectedInvoiceIds}
        selectedInvoices={invoices.filter((invoice) => selectedInvoiceIds.includes(invoice.id))}
        onClearSelection={clearSelectedInvoices}
        onBatchComplete={() => {
          clearSelectedInvoices()
          void loadInvoices()
        }}
      />
      {toast && <div role="status" className={`fixed bottom-5 right-5 z-70 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg ${toast.tone === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>{toast.message}</div>}
    </div>
  )
}

const SummaryCard = ({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: 'indigo' | 'emerald' | 'amber' | 'rose' }) => {
  const styles = { indigo: 'bg-indigo-50 text-indigo-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600' }
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${styles[tone]}`}>{icon}</div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 truncate text-xl font-bold text-slate-900">{value}</p></div>
}

const FilterSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) => <label className="block"><span className="sr-only">Filter by {label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>

const ActionButton = ({ icon, label, onClick, disabled = false }: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean }) => <button type="button" disabled={disabled} onClick={onClick} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">{icon}{label}</button>

const InvoiceSkeletonRows = () => <>{Array.from({ length: 5 }, (_, index) => <tr key={index} className="border-b border-slate-100"><td colSpan={7} className="px-4 py-4"><div className="h-7 animate-pulse rounded bg-slate-100" /></td></tr>)}</>

const ActionDialog = ({ action, invoice, reason, isSubmitting, onReasonChange, onClose, onVoid }: { action: ActionType; invoice: InvoiceDocument; reason: string; isSubmitting: boolean; onReasonChange: (value: string) => void; onClose: () => void; onVoid: () => void }) => {
  const isVoid = action === 'void'
  const isRefund = action === 'refund'
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="invoice-action-title"><button type="button" className="absolute inset-0 cursor-default" aria-label="Close dialog" onClick={onClose} /><div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Invoice action</p><h2 id="invoice-action-title" className="mt-1 text-lg font-bold text-slate-900">{invoice.invoiceNumber || invoice.id}</h2></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>{action === 'audit' && <dl className="mt-5 grid gap-3 sm:grid-cols-2">{[['Status', STATUS_LABELS[invoice.status]], ['Order ID', invoice.orderId], ['Payment method', invoice.paymentMethod], ['Verified by', invoice.verifiedBy || 'Not verified'], ['Verified at', invoice.verifiedAt ? formatDate(invoice.verifiedAt) : 'Not verified'], ['Updated at', formatDate(invoice.updatedAt)]].map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 p-3"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 wrap-break-word text-sm text-slate-700">{value}</dd></div>)}</dl>}{isVoid && <div className="mt-5"><p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">Force voiding permanently changes the invoice status.</p><label className="mt-4 block text-sm font-semibold text-slate-800">Reason<input value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="Enter a reason" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-400" /></label></div>}{isRefund && <p className="mt-5 rounded-lg bg-blue-50 px-3 py-3 text-sm text-blue-800">Refund processing is ready in the admin workflow, but the invoice service does not currently expose a refund endpoint.</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Close</button>{isVoid && <button type="button" disabled={!reason.trim() || isSubmitting} onClick={onVoid} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{isSubmitting && <Loader2 size={14} className="animate-spin" />} Force void</button>}</div></div></div>
}

export default AdminInvoicesPage
