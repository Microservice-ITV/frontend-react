import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { productLabel, useProductNames } from '@/features/warehouse/hooks/useProductNames'
import { useWarehouses } from '@/features/warehouse/hooks/useWarehouseData'
import { purchaseApi, purchaseErrorMessage } from '../api/purchaseApi'
import { PurchaseOrderStatusBadge } from '../components/PurchaseBadges'
import { purchasePaths, type PurchaseAreaBase } from '../config/purchasePaths'
import { secondaryButtonClass } from '../config/purchaseUiClasses'
import { notifyOrderedReceiptCountChanged } from '../orderedReceiptCount'
import { usePurchaseOrders } from '../hooks/usePurchaseData'
import type { PurchaseOrder } from '../types/purchaseTypes'

const primaryButtonClass =
  'inline-flex cursor-pointer items-center justify-center rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50'

const ReceiveSupplierPage = ({ base }: { base: PurchaseAreaBase }) => {
  const paths = purchasePaths(base)
  const waiting = usePurchaseOrders({ status: 'ORDERED' })
  const received = usePurchaseOrders({ status: 'RECEIVED' })
  const { warehouses } = useWarehouses()
  const productNames = useProductNames()
  const [receivingId, setReceivingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(
    null,
  )

  const loading = waiting.loading || received.loading
  const error = waiting.error ?? received.error
  const reload = async () => {
    await Promise.all([waiting.reload(), received.reload()])
  }

  const rows = [...waiting.orders, ...received.orders]
    .filter((order) => order.orderKind === 'SUPPLIER')
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === 'ORDERED' ? -1 : 1
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    })

  const receive = async (order: PurchaseOrder) => {
    setReceivingId(order.id)
    setFeedback(null)
    try {
      await purchaseApi.receiveSupplierOrder(order.id)
      setFeedback({
        tone: 'success',
        message: `${order.orderNumber} received into the warehouse.`,
      })
      await reload()
      notifyOrderedReceiptCountChanged()
    } catch (err) {
      setFeedback({ tone: 'danger', message: purchaseErrorMessage(err) })
    } finally {
      setReceivingId(null)
    }
  }

  const columns: Array<DataTableColumn<PurchaseOrder>> = [
    {
      key: 'orderNumber',
      header: 'Order',
      sortValue: (row) => row.orderNumber,
      render: (row) => <span className="text-sm font-medium text-slate-800">{row.orderNumber}</span>,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (row) => <span className="text-sm text-slate-700">{row.supplier?.name ?? '—'}</span>,
    },
    {
      key: 'warehouse',
      header: 'Warehouse',
      render: (row) => (
        <span className="text-sm text-slate-700">
          {warehouses.find((warehouse) => warehouse.id === row.warehouseId)?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'products',
      header: 'Products',
      render: (row) => (
        <span className="block max-w-[280px] truncate text-sm text-slate-700">
          {(row.items ?? [])
            .map((item) => `${productLabel(productNames, item.productId)} × ${item.quantity}`)
            .join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      render: (row) => <PurchaseOrderStatusBadge status={row.status} />,
    },
    {
      key: 'receivedAt',
      header: 'Received',
      sortValue: (row) => (row.status === 'RECEIVED' ? row.updatedAt : ''),
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-slate-700">
          {row.status === 'RECEIVED' ? new Date(row.updatedAt).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '120px',
      render: (row) =>
        row.status === 'ORDERED' ? (
          <button
            type="button"
            className={primaryButtonClass}
            disabled={receivingId === row.id}
            onClick={() => void receive(row)}
          >
            {receivingId === row.id ? 'Receiving…' : 'Received'}
          </button>
        ) : null,
    },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">
          Warehouse
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Receive from Supplier</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Receive from Supplier</h1>
          <p className="text-sm text-slate-500">
            Supplier orders stay here until you click Received. The products enter this warehouse only then.
            Orders you have already received stay in this table.
          </p>
        </div>
        <button type="button" className={secondaryButtonClass} disabled={loading} onClick={() => void reload()}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.tone === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
          {feedback.message}
        </p>
      )}

      <DataTable<PurchaseOrder>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No supplier orders yet."
        minWidth="1040px"
      />
    </div>
  )
}

export default ReceiveSupplierPage
