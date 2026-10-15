import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, RefreshCw } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import ModalDrawer from '@/components/ui/ModalDrawer'
import StatusBadge from '@/components/ui/StatusBadge'
import { notifyDashboardMenuBadgesChanged } from '@/features/dashboard/dashboardMenuBadges'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { secondaryButtonClass } from '../config/purchaseUiClasses'

type DamageReportStatus = 'DRAFT' | 'SUBMITTED' | 'CONFIRMED'

type DamageReportRow = {
  id: string
  reportNumber: string
  notes: string | null
  status: DamageReportStatus
  confirmedAt?: string | null
  stockReducedAt?: string | null
  createdAt: string
  purchaseOrder?: {
    id: string
    orderNumber: string
    status: string
    supplier?: { name?: string | null } | null
  } | null
  items?: Array<{
    id: string
    productName: string | null
    productId: string
    variantId?: string
    quantity: number
    damageType: string | null
    notes: string | null
  }>
}

const detailsButtonClass =
  'inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50'
const confirmButtonClass =
  'inline-flex cursor-pointer items-center justify-center rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50'

const statusTone = (status: DamageReportStatus) => {
  if (status === 'CONFIRMED') return 'success' as const
  if (status === 'SUBMITTED') return 'warning' as const
  return 'neutral' as const
}

const statusLabel = (status: DamageReportStatus) => {
  if (status === 'CONFIRMED') return 'Confirmed'
  if (status === 'SUBMITTED') return 'Awaiting confirmation'
  return status
}

const DamageReportsPage = ({
  base,
}: {
  base: '/seller' | '/delivery-agent'
}) => {
  const isSeller = base === '/seller'
  const [rows, setRows] = useState<DamageReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [details, setDetails] = useState<DamageReportRow | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await purchaseApi.listDamageReports()
      setRows(response.data?.data ?? [])
    } catch (err) {
      setRows([])
      setError(purchaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openDetails = async (id: string) => {
    setDetailsLoading(true)
    setDetailsError(null)
    try {
      const response = await purchaseApi.getDamageReport(id)
      setDetails(response.data?.data ?? null)
    } catch (err) {
      setDetails(null)
      setDetailsError(purchaseErrorMessage(err))
    } finally {
      setDetailsLoading(false)
    }
  }

  const confirmReport = async (id: string) => {
    setConfirmingId(id)
    setFeedback(null)
    setDetailsError(null)
    try {
      const response = await purchaseApi.confirmDamageReport(id)
      const updated = response.data?.data as DamageReportRow | undefined
      setFeedback(
        updated?.stockReducedAt
          ? 'Damage report confirmed. Damaged quantities were removed from your inventory.'
          : 'Damage report confirmed. Damaged quantities will be excluded when you receive this parcel.',
      )
      await load()
      notifyDashboardMenuBadgesChanged()
      if (updated) setDetails(updated)
      else if (details?.id === id) await openDetails(id)
    } catch (err) {
      const message = purchaseErrorMessage(err)
      if (details?.id === id) setDetailsError(message)
      else setFeedback(message)
    } finally {
      setConfirmingId(null)
    }
  }

  const columns: Array<DataTableColumn<DamageReportRow>> = [
    {
      key: 'report',
      header: 'Report',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.reportNumber}</p>
          <p className="text-xs text-slate-500">{row.purchaseOrder?.orderNumber ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '170px',
      render: (row) => (
        <StatusBadge label={statusLabel(row.status)} tone={statusTone(row.status)} />
      ),
    },
    {
      key: 'items',
      header: 'Damaged products',
      render: (row) => (
        <span className="block max-w-[320px] truncate text-sm text-slate-700">
          {(row.items ?? [])
            .map(
              (item) =>
                `${item.productName ?? item.productId} × ${item.quantity}${
                  item.damageType ? ` (${item.damageType})` : ''
                }`,
            )
            .join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (row) => (
        <span className="block max-w-[200px] truncate text-sm text-slate-600">
          {row.notes || '—'}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Reported',
      width: '160px',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: isSeller ? '220px' : '110px',
      render: (row) => (
        <div className="flex flex-nowrap items-center justify-end gap-1.5">
          <button
            type="button"
            className={detailsButtonClass}
            onClick={() => void openDetails(row.id)}
          >
            <Eye size={13} />
            Details
          </button>
          {isSeller && row.status === 'SUBMITTED' && (
            <button
              type="button"
              className={confirmButtonClass}
              disabled={confirmingId === row.id}
              onClick={() => void confirmReport(row.id)}
            >
              {confirmingId === row.id ? 'Confirming…' : 'Confirm'}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={base} className="hover:text-slate-700">
          {isSeller ? 'Seller' : 'Delivery'}
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Damage reports</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Damage reports</h1>
          <p className="text-sm text-slate-500">
            {isSeller
              ? 'Review delivery-agent reports, open details, and confirm to reduce damaged warehouse stock.'
              : 'Damage reports you submitted while inspecting supplier parcels.'}
          </p>
        </div>
        <button type="button" className={secondaryButtonClass} disabled={loading} onClick={() => void load()}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.includes('confirmed') ? 'text-emerald-700' : 'text-rose-600'}`}>
          {feedback}
        </p>
      )}

      <DataTable<DamageReportRow>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No damage reports yet."
        minWidth="960px"
      />

      <ModalDrawer
        open={Boolean(details) || detailsLoading || Boolean(detailsError)}
        onClose={() => {
          setDetails(null)
          setDetailsError(null)
        }}
        title="Damage report details"
        subtitle={details?.reportNumber}
        size="lg"
        footer={
          <>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => {
                setDetails(null)
                setDetailsError(null)
              }}
            >
              Close
            </button>
            {isSeller && details?.status === 'SUBMITTED' && (
              <button
                type="button"
                className={confirmButtonClass}
                disabled={confirmingId === details.id}
                onClick={() => void confirmReport(details.id)}
              >
                {confirmingId === details.id ? 'Confirming…' : 'Confirm report'}
              </button>
            )}
          </>
        }
      >
        {detailsLoading && <p className="text-sm text-slate-500">Loading details…</p>}
        {detailsError && <p className="text-sm text-rose-600">{detailsError}</p>}
        {details && !detailsLoading && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Order</p>
                <p className="text-sm text-slate-800">{details.purchaseOrder?.orderNumber ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</p>
                <div className="mt-1">
                  <StatusBadge label={statusLabel(details.status)} tone={statusTone(details.status)} />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Reported</p>
                <p className="text-sm text-slate-800">{new Date(details.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Confirmed</p>
                <p className="text-sm text-slate-800">
                  {details.confirmedAt ? new Date(details.confirmedAt).toLocaleString() : '—'}
                </p>
              </div>
            </div>

            {details.notes && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Notes</p>
                <p className="mt-1 text-sm text-slate-700">{details.notes}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                Damaged products
              </p>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Product</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 text-right font-medium">Qty</th>
                      <th className="px-3 py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(details.items ?? []).map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-800">
                          {item.productName?.trim() || item.productId}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{item.damageType || '—'}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{item.notes || '—'}</td>
                      </tr>
                    ))}
                    {(details.items ?? []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                          No damaged lines on this report.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {isSeller && details.status === 'SUBMITTED' && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Confirming removes these damaged quantities from the purchase-order warehouse after
                you post a goods receipt (or immediately if you already received it).
              </p>
            )}
            {details.status === 'CONFIRMED' && details.stockReducedAt && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                Stock already reduced on {new Date(details.stockReducedAt).toLocaleString()}.
              </p>
            )}
          </div>
        )}
      </ModalDrawer>
    </div>
  )
}

export default DamageReportsPage
