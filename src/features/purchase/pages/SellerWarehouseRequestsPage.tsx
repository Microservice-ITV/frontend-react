import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, RefreshCw } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import { PurchaseOrderStatusBadge } from '../components/PurchaseBadges'
import PurchaseOrderDetailsPanel from '../components/PurchaseOrderDetailsPanel'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import {
  approveButtonClass,
  detailsButtonClass,
  purchaseTabClass,
  rejectButtonClass,
  secondaryButtonClass,
} from '../config/purchaseUiClasses'
import { notifyDashboardMenuBadgesChanged } from '@/features/dashboard/dashboardMenuBadges'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { usePurchaseOrders } from '../hooks/usePurchaseData'
import {
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from '../types/purchaseTypes'
import { downloadPurchaseOrderAttachment } from '../utils/downloadPurchaseOrderAttachment'
import { orderProductPreview } from '../utils/orderProductPreview'

const PENDING_STATUSES = new Set<PurchaseOrderStatus>([
  'PENDING_APPROVAL',
  'PENDING',
  'LOW_STOCK',
])

type ViewTab = 'pending' | 'history'

const SellerWarehouseRequestsPage = ({ base }: { base: PurchaseAreaBase }) => {
  const paths = purchasePaths(base)
  const [tab, setTab] = useState<ViewTab>('history')
  const [status, setStatus] = useState<PurchaseOrderStatus | ''>('')
  const [search, setSearch] = useState('')
  const { orders, loading, error, reload } = usePurchaseOrders({ limit: 500 })

  const [details, setDetails] = useState<PurchaseOrder | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const warehouseOrders = useMemo(
    () => orders.filter((order) => order.orderKind === 'WAREHOUSE'),
    [orders],
  )

  const pendingCount = useMemo(
    () => warehouseOrders.filter((order) => PENDING_STATUSES.has(order.status)).length,
    [warehouseOrders],
  )

  const term = search.trim().toLowerCase()
  const rows = warehouseOrders.filter((order) => {
    const inTab =
      tab === 'pending'
        ? PENDING_STATUSES.has(order.status)
        : !PENDING_STATUSES.has(order.status)
    if (!inTab) return false
    if (tab === 'history' && status && order.status !== status) return false
    if (!term) return true
    const haystack = [
      order.orderNumber,
      order.warehouse?.name,
      order.createdBy,
      ...(order.items ?? []).map((item) => item.productName ?? item.productId),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(term)
  })

  const openDetails = async (id: string) => {
    setDetailsLoading(true)
    setDetailsError(null)
    try {
      const response = await purchaseApi.getPurchaseOrder(id)
      setDetails(response.data?.data ?? null)
    } catch (err) {
      setDetailsError(purchaseErrorMessage(err))
    } finally {
      setDetailsLoading(false)
    }
  }

  const changeStatus = async (id: string, next: PurchaseOrderStatus) => {
    setFeedback(null)
    setActingId(id)
    try {
      await purchaseApi.updatePurchaseOrderStatus(id, next)
      await reload()
      notifyDashboardMenuBadgesChanged()
      if (details?.id === id) await openDetails(id)
    } catch (err) {
      setFeedback(purchaseErrorMessage(err))
    } finally {
      setActingId(null)
    }
  }

  const columns: Array<DataTableColumn<PurchaseOrder>> = [
    {
      key: 'orderNumber',
      header: 'Request',
      sortValue: (row) => row.orderNumber,
      render: (row) => (
        <div>
          <p className="whitespace-nowrap font-medium text-slate-900">{row.orderNumber}</p>
          <p className="truncate text-xs text-slate-400">
            {row.warehouse?.name ?? 'Warehouse'} · {(row.items ?? []).length} product
            {(row.items ?? []).length === 1 ? '' : 's'}
          </p>
        </div>
      ),
    },
    {
      key: 'products',
      header: 'Products',
      render: (row) => {
        const preview = orderProductPreview(row.items)
        if (!preview) return <span className="text-xs text-slate-400">—</span>
        return <span className="text-xs text-slate-600">{preview}</span>
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '160px',
      sortValue: (row) => row.status,
      render: (row) => <PurchaseOrderStatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Requested',
      width: '110px',
      sortValue: (row) => row.createdAt,
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '260px',
      render: (row) => {
        const pending = PENDING_STATUSES.has(row.status)
        const busy = actingId === row.id
        return (
          <div className="flex flex-nowrap items-center justify-end gap-1.5">
            <button
              type="button"
              className={detailsButtonClass}
              onClick={() => void openDetails(row.id)}
            >
              <Eye size={13} />
              Details
            </button>
            {pending && (
              <>
                <button
                  type="button"
                  className={approveButtonClass}
                  disabled={busy}
                  onClick={() => void changeStatus(row.id, 'APPROVED')}
                >
                  {busy ? '…' : 'Approve'}
                </button>
                <button
                  type="button"
                  className={rejectButtonClass}
                  disabled={busy}
                  onClick={() => void changeStatus(row.id, 'CANCELLED')}
                >
                  Reject
                </button>
              </>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">
          Warehouse
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Request from seller</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Request from seller</h1>
          <p className="text-sm text-slate-500">
            Approve seller stock requests from your warehouse, and review request history.
          </p>
        </div>
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={loading}
          onClick={() => void reload()}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={purchaseTabClass(tab === 'history')} onClick={() => setTab('history')}>
          History
        </button>
        <button
          type="button"
          className={purchaseTabClass(tab === 'pending')}
          onClick={() => {
            setTab('pending')
            setStatus('')
          }}
        >
          To approve
          {pendingCount > 0 && (
            <span
              className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none ${
                tab === 'pending'
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--dni-primary)] text-white'
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {feedback && <p className="text-sm text-red-600">{feedback}</p>}

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search order number or product…',
        }}
        selects={
          tab === 'history'
            ? [
                {
                  key: 'status',
                  label: 'Status',
                  value: status,
                  allLabel: 'All statuses',
                  onChange: (value) => setStatus(value as PurchaseOrderStatus | ''),
                  options: [
                    { value: 'AWAITING_SELLER_RECEIPT', label: 'Awaiting seller receipt' },
                    { value: 'RECEIVED', label: 'Received' },
                    { value: 'CANCELLED', label: 'Rejected / cancelled' },
                    { value: 'RESTOCK_REQUESTED', label: 'Restock requested' },
                    { value: 'RESTOCK_APPROVED', label: 'Restock approved' },
                  ],
                },
              ]
            : []
        }
      />

      <DataTable<PurchaseOrder>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage={
          tab === 'pending'
            ? 'No pending seller requests.'
            : 'No request history yet.'
        }
        itemLabel="requests"
        minWidth="980px"
        fixedLayout
      />

      {(details || detailsLoading || detailsError) && (
        <ModalDrawer
          open
          onClose={() => {
            setDetails(null)
            setDetailsError(null)
          }}
          title={details?.orderNumber ?? 'Request details'}
          subtitle="Seller warehouse request"
          size="md"
          fitContent
        >
          <PurchaseOrderDetailsPanel
            order={details}
            loading={detailsLoading}
            error={detailsError}
            onDownloadAttachment={(orderId, attachment) =>
              void downloadPurchaseOrderAttachment(orderId, attachment)
            }
          />
        </ModalDrawer>
      )}
    </div>
  )
}

export default SellerWarehouseRequestsPage
