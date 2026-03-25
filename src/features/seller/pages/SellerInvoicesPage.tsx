import { useState } from 'react'
import { Link } from 'react-router-dom'
import DataTablePagination from '@/components/ui/DataTablePagination'
import { Search, Download, SendHorizontal } from 'lucide-react'
import type { Invoice, InvoiceStatus } from '../types/invoiceTypes'

const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-2041', customer: { name: 'Emma Wilson', email: 'emma@example.com' }, orderId: 'ORD-7891', status: 'paid', issued: 'Feb 14, 2026', due: 'Mar 14, 2026', amount: '$299.00' },
  { id: 'INV-2040', customer: { name: 'James Chen', email: 'james@company.io' }, orderId: 'ORD-7890', status: 'pending', issued: 'Feb 14, 2026', due: 'Mar 14, 2026', amount: '$599.00' },
  { id: 'INV-2039', customer: { name: 'Sofia Garcia', email: 'sofia@startup.co' }, orderId: 'ORD-7889', status: 'paid', issued: 'Feb 13, 2026', due: 'Mar 13, 2026', amount: '$1,499.00' },
  { id: 'INV-2038', customer: { name: 'Alex Thompson', email: 'alex@dev.com' }, orderId: 'ORD-7888', status: 'pending', issued: 'Feb 13, 2026', due: 'Mar 13, 2026', amount: '$79.00' },
  { id: 'INV-2037', customer: { name: 'Maria Santos', email: 'maria@agency.co' }, orderId: 'ORD-7887', status: 'paid', issued: 'Feb 12, 2026', due: 'Mar 12, 2026', amount: '$299.00' },
  { id: 'INV-2036', customer: { name: 'Lisa Park', email: 'lisa@design.co' }, orderId: 'ORD-7886', status: 'paid', issued: 'Feb 11, 2026', due: 'Mar 11, 2026', amount: '$299.00' },
  { id: 'INV-2035', customer: { name: 'Ryan Mitchell', email: 'ryan@startup.io' }, orderId: 'ORD-7884', status: 'paid', issued: 'Feb 11, 2026', due: 'Mar 11, 2026', amount: '$1,499.00' },
  { id: 'INV-2034', customer: { name: 'Nina Patel', email: 'nina@corp.com' }, orderId: 'ORD-7883', status: 'overdue', issued: 'Jan 10, 2026', due: 'Feb 10, 2026', amount: '$79.00' },
  { id: 'INV-2033', customer: { name: 'Tom Bradley', email: 'tom@agency.io' }, orderId: 'ORD-7882', status: 'overdue', issued: 'Jan 10, 2026', due: 'Feb 10, 2026', amount: '$599.00' },
  { id: 'INV-2032', customer: { name: 'Anna Kowalski', email: 'anna@dev.co' }, orderId: 'ORD-7881', status: 'paid', issued: 'Feb 9, 2026', due: 'Mar 9, 2026', amount: '$299.00' },
  { id: 'INV-2031', customer: { name: 'Victor Yang', email: 'victor@team.io' }, orderId: 'ORD-7880', status: 'pending', issued: 'Feb 8, 2026', due: 'Mar 8, 2026', amount: '$999.00' },
  { id: 'INV-2030', customer: { name: 'Helen Brooks', email: 'helen@corp.io' }, orderId: 'ORD-7879', status: 'paid', issued: 'Feb 7, 2026', due: 'Mar 7, 2026', amount: '$149.00' },
]

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
}

const FILTER_TABS: { key: 'all' | InvoiceStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
]

const SellerInvoicesPage = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | InvoiceStatus>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const filteredInvoices = MOCK_INVOICES.filter((invoice) => {
    const matchesFilter = activeFilter === 'all' || invoice.status === activeFilter
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      invoice.id.toLowerCase().includes(q) ||
      invoice.customer.name.toLowerCase().includes(q) ||
      invoice.customer.email.toLowerCase().includes(q) ||
      invoice.orderId.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / rowsPerPage))
  const paginatedInvoices = filteredInvoices.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
        <p className="mt-0.5 text-sm text-slate-600">View and manage your invoices.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-900">All Invoices</p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-52">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveFilter(tab.key)
                    setPage(1)
                  }}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${
                    activeFilter === tab.key
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
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Invoice</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Customer</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Order</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Status</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Issued</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Due</th>
                <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">Amount</th>
                <th className="px-2 py-2 text-right text-[11px] font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-2 py-3 text-xs font-semibold text-slate-900">{invoice.id}</td>
                  <td className="px-2 py-3">
                    <p className="text-xs font-medium text-slate-900">{invoice.customer.name}</p>
                    <p className="text-[11px] text-slate-500">{invoice.customer.email}</p>
                  </td>
                  <td className="px-2 py-3 text-xs text-slate-600">{invoice.orderId}</td>
                  <td className="px-2 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLES[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-xs text-slate-600">{invoice.issued}</td>
                  <td className="px-2 py-3 text-xs text-slate-600">{invoice.due}</td>
                  <td className="px-2 py-3 text-xs font-semibold text-slate-900">{invoice.amount}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center justify-end gap-2 text-slate-500">
                      <button type="button" className="cursor-pointer rounded p-1 hover:bg-slate-100 hover:text-slate-700" aria-label="Download invoice">
                        <Download size={14} />
                      </button>
                      <button type="button" className="cursor-pointer rounded p-1 hover:bg-slate-100 hover:text-slate-700" aria-label="Send invoice">
                        <SendHorizontal size={14} />
                      </button>
                    </div>
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
          totalItems={filteredInvoices.length}
          itemLabel="invoices"
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value)
            setPage(1)
          }}
        />
      </div>
    </section>
  )
}

export default SellerInvoicesPage