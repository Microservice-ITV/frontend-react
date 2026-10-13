import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftRight, ArrowRight, Plus, type LucideIcon } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import StatusBadge, { type BadgeTone } from '@/components/ui/StatusBadge'
import TransferStockForm from '../components/forms/TransferStockForm'
import { primaryButtonClass } from '../components/forms/FormField'
import { warehouseApi, warehouseErrorMessage } from '../api/warehouseApi'
import { warehousePaths, type WarehouseAreaBase } from '../config/warehousePaths'
import { useWarehouses } from '../hooks/useWarehouseData'
import { productLabel, useProductNames } from '../hooks/useProductNames'
import {
  TRANSFER_STATUSES,
  TRANSFER_STATUS_LABELS,
  transferStatusLabel,
  type StockOperationKind,
  type TransferStatus,
  type WarehouseTransfer,
} from '../types/warehouseTypes'

export type StockOperationPageProps = {
  base: WarehouseAreaBase
  kind: StockOperationKind
}

const OPERATION_COPY: Record<
  StockOperationKind,
  {
    label: string
    title: string
    subtitle: string
    description: string
    icon: LucideIcon
    variant: 'modal' | 'drawer'
    size: 'md' | 'xl' | 'lg'
  }
> = {
  transfer: {
    label: 'Transfer',
    title: 'Transfer Stock',
    subtitle: 'Request a transfer between warehouses — waits for approval.',
    description:
      'Transfers stay here with their status. A warehouse transfer waits for the seller, then the warehouse manager completes it.',
    icon: ArrowLeftRight,
    variant: 'drawer',
    size: 'lg',
  },
}

const transferTone = (status: TransferStatus): BadgeTone => {
  if (status === 'APPROVED') return 'success'
  if (status === 'SELLER_APPROVED' || status === 'AWAITING_RECEIPT') return 'info'
  if (status === 'REJECTED') return 'danger'
  return 'warning'
}

const StockOperationPage = ({ base, kind }: StockOperationPageProps) => {
  const paths = warehousePaths(base)
  const copy = OPERATION_COPY[kind]
  const Icon = copy.icon

  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TransferStatus | ''>('')
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>([])
  const [transfersLoading, setTransfersLoading] = useState(true)
  const [transfersError, setTransfersError] = useState<string | null>(null)
  const { warehouses, loading, error, reload } = useWarehouses(
    base === '/seller' ? { catalog: true, status: 'ACTIVE' } : undefined,
  )
  const productNames = useProductNames()

  const loadTransfers = useCallback(async () => {
    setTransfersLoading(true)
    setTransfersError(null)
    try {
      const response = await warehouseApi.listTransfers({ limit: 500 })
      setTransfers(response.data?.data ?? [])
    } catch (err) {
      setTransfers([])
      setTransfersError(warehouseErrorMessage(err))
    } finally {
      setTransfersLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTransfers()
  }, [loadTransfers])

  const warehouseName = useCallback(
    (id: string) => warehouses.find((warehouse) => warehouse.id === id)?.name ?? id.slice(0, 8),
    [warehouses],
  )

  const rows = useMemo(() => {
    const warehouseIds = new Set(warehouses.map((warehouse) => warehouse.id))
    const term = search.trim().toLowerCase()
    return transfers.filter((transfer) => {
      if (
        base !== '/seller' &&
        !loading &&
        !warehouseIds.has(transfer.fromWarehouseId ?? '') &&
        !warehouseIds.has(transfer.toWarehouseId)
      ) {
        return false
      }
      if (status && transfer.status !== status) return false
      if (!term) return true
      const haystack = `${transfer.referenceId ?? ''} ${productLabel(productNames, transfer.productId)} ${transfer.fromSellerUserId ? 'seller inventory' : warehouseName(transfer.fromWarehouseId ?? '')} ${warehouseName(transfer.toWarehouseId)} ${transfer.status}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [transfers, warehouses, loading, search, status, productNames, warehouseName, base])

  const completeTransfer = async (transfer: WarehouseTransfer) => {
    const label = transfer.referenceId ?? transfer.id.slice(0, 8)
    setNotice(null)
    try {
      const response = await warehouseApi.approveTransfer(transfer.id)
      const nextStatus = response.data?.data?.transfer?.status
      setNotice(
        nextStatus === 'AWAITING_RECEIPT'
          ? `Transfer ${label} sent. The destination warehouse manager can receive it.`
          : `Transfer ${label} completed — stock moved.`,
      )
      await loadTransfers()
    } catch (err) {
      setNotice(null)
      setTransfersError(warehouseErrorMessage(err))
    }
  }

  const receiveTransfer = async (transfer: WarehouseTransfer) => {
    const label = transfer.referenceId ?? transfer.id.slice(0, 8)
    setNotice(null)
    try {
      await warehouseApi.receiveTransfer(transfer.id)
      setNotice(`Transfer ${label} received — stock is in the destination warehouse.`)
      await loadTransfers()
    } catch (err) {
      setTransfersError(warehouseErrorMessage(err))
    }
  }

  const columns: Array<DataTableColumn<WarehouseTransfer>> = [
    {
      key: 'reference',
      header: 'Reference',
      width: '170px',
      sortValue: (row) => row.referenceId ?? row.id,
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-slate-700">
          {row.referenceId ?? row.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      sortValue: (row) => productLabel(productNames, row.productId),
      render: (row) => (
        <span
          className="block max-w-[220px] truncate text-sm text-slate-700"
          title={row.productId}
        >
          {productLabel(productNames, row.productId)}
        </span>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
          {row.fromSellerUserId ? 'Seller inventory' : warehouseName(row.fromWarehouseId ?? '')}
          <ArrowRight size={13} className="shrink-0 text-slate-400" />
          {warehouseName(row.toWarehouseId)}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'right',
      width: '80px',
      sortValue: (row) => row.quantity,
      render: (row) => <span className="font-medium text-slate-900">{row.quantity}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '170px',
      sortValue: (row) => row.status,
      render: (row) => (
        <StatusBadge label={transferStatusLabel(row)} tone={transferTone(row.status)} />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '200px',
      render: (row) =>
        base === '/warehouse-manager' &&
        row.status === 'SELLER_APPROVED' &&
        warehouses.some((warehouse) => warehouse.id === row.fromWarehouseId) ? (
          <button
            type="button"
            className={`${primaryButtonClass} whitespace-nowrap`}
            onClick={() => void completeTransfer(row)}
          >
            Complete transfer
          </button>
        ) : base === '/warehouse-manager' &&
          row.status === 'AWAITING_RECEIPT' &&
          warehouses.some((warehouse) => warehouse.id === row.toWarehouseId) ? (
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => void receiveTransfer(row)}
          >
            Received
          </button>
        ) : null,
    },
    {
      key: 'created',
      header: 'Created',
      width: '170px',
      sortValue: (row) => row.createdAt,
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
  ]

  const handleSuccess = (message: string) => {
    void reload()
    void loadTransfers()
    setNotice(message)
    setOpen(false)
  }

  const body = () => {
    if (loading) {
      return <p className="text-sm text-slate-500">Loading warehouses…</p>
    }
    if (error) {
      return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )
    }
    switch (kind) {
      case 'transfer':
        return (
          <TransferStockForm
            warehouses={warehouses}
            sellerMode={base === '/seller'}
            onSuccess={() =>
              handleSuccess(
                base === '/seller'
                  ? 'Transfer request submitted. The source warehouse manager can complete it.'
                  : 'Transfer request submitted. It waits for the seller to approve.',
              )
            }
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.overview} className="hover:text-slate-700">
          Warehouse
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">{copy.label}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{copy.title}</h1>
          <p className="text-sm text-slate-500">{copy.description}</p>
        </div>
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => {
            setNotice(null)
            setOpen(true)
          }}
        >
          <Plus size={16} />
          New transfer
        </button>
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search reference, product, or warehouse…',
        }}
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            allLabel: 'All statuses',
            onChange: (value) => setStatus(value as TransferStatus | ''),
            options: TRANSFER_STATUSES.map((option) => ({
              value: option,
              label: TRANSFER_STATUS_LABELS[option],
            })),
          },
        ]}
      />

      <DataTable<WarehouseTransfer>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={transfersLoading || loading}
        error={transfersError}
        emptyMessage="No transfers yet."
        emptyIcon={Icon}
        clientPaginated
        itemLabel="transfers"
        minWidth="860px"
      />

      <ModalDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={copy.title}
        subtitle={copy.subtitle}
        variant={copy.variant}
        size={copy.size}
        closeOnBackdrop={false}
      >
        {body()}
      </ModalDrawer>
    </div>
  )
}

export default StockOperationPage
