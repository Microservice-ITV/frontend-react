import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftRight, ArrowRight, Check, Plus, X, type LucideIcon } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import ModalDrawer from '@/components/ui/ModalDrawer'
import StatusBadge, { type BadgeTone } from '@/components/ui/StatusBadge'
import { useAppSelector } from '@/app/hooks'
import TransferStockForm from '../components/forms/TransferStockForm'
import { primaryButtonClass } from '../components/forms/FormField'
import { notifyDashboardMenuBadgesChanged } from '@/features/dashboard/dashboardMenuBadges'
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
    subtitle: 'Move stock between warehouses.',
    description:
      'Seller-started moves are auto-approved; the warehouse manager completes them. Manager requests wait for seller approval.',
    icon: ArrowLeftRight,
    variant: 'drawer',
    size: 'lg',
  },
}

const actionButtonClass =
  'inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-50'
const approveActionClass = `${actionButtonClass} bg-emerald-600 text-white hover:bg-emerald-700`
const rejectActionClass = `${actionButtonClass} border border-slate-200 bg-white text-slate-600 hover:bg-slate-100`

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
  const [decidingId, setDecidingId] = useState<string | null>(null)
  const { warehouses, loading, error, reload } = useWarehouses(
    base === '/seller' ? { status: 'ACTIVE', includePurchased: true } : undefined,
  )
  const productNames = useProductNames()
  const authUser = useAppSelector((state) => state.auth.user)
  const authUserIds = useMemo(
    () =>
      [...new Set([authUser?.id, (authUser as { sub?: string } | null)?.sub].filter(Boolean))] as string[],
    [authUser],
  )
  const authUserId = authUserIds[0] ?? ''
  const isSeller = base === '/seller'
  const isWarehouseManager = base === '/warehouse-manager'

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

  const ownedWarehouseIds = useMemo(
    () => new Set(warehouses.map((warehouse) => warehouse.id)),
    [warehouses],
  )

  const pendingApprovals = useMemo(
    () =>
      transfers.filter((transfer) => {
        if (transfer.status !== 'PENDING') return false
        if (isSeller) {
          // Only WM-initiated warehouse transfers need seller approval.
          if (!transfer.approvalSellerUserId || transfer.fromSellerUserId) return false
          // Seller who requested their own move already skipped approval.
          if (transfer.requestedBy && authUserIds.includes(transfer.requestedBy)) {
            return false
          }
          return true
        }
        if (isWarehouseManager) {
          return Boolean(transfer.fromSellerUserId) && ownedWarehouseIds.has(transfer.toWarehouseId)
        }
        return false
      }),
    [transfers, isSeller, isWarehouseManager, ownedWarehouseIds, authUserIds],
  )

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return transfers.filter((transfer) => {
      if (
        !isSeller &&
        !loading &&
        !ownedWarehouseIds.has(transfer.fromWarehouseId ?? '') &&
        !ownedWarehouseIds.has(transfer.toWarehouseId)
      ) {
        return false
      }
      if (status && transfer.status !== status) return false
      if (!term) return true
      const haystack = `${transfer.referenceId ?? ''} ${productLabel(productNames, transfer.productId)} ${transfer.fromSellerUserId ? 'seller inventory' : warehouseName(transfer.fromWarehouseId ?? '')} ${warehouseName(transfer.toWarehouseId)} ${transfer.status}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [
    transfers,
    loading,
    search,
    status,
    productNames,
    warehouseName,
    isSeller,
    ownedWarehouseIds,
  ])

  const decideTransfer = async (
    transfer: WarehouseTransfer,
    action: 'approve' | 'reject' | 'receive' | 'complete',
  ) => {
    const label = transfer.referenceId ?? transfer.id.slice(0, 8)
    setDecidingId(transfer.id)
    setNotice(null)
    try {
      if (action === 'receive') {
        await warehouseApi.receiveTransfer(transfer.id)
        setNotice(`Transfer ${label} received — stock is in the destination warehouse.`)
      } else if (action === 'reject') {
        await warehouseApi.rejectTransfer(transfer.id, 'Rejected from transfer page')
        setNotice(`Transfer ${label} rejected.`)
      } else {
        const response = await warehouseApi.approveTransfer(transfer.id)
        const nextStatus = response.data?.data?.transfer?.status
        if (action === 'complete' || nextStatus === 'AWAITING_RECEIPT') {
          setNotice(
            nextStatus === 'AWAITING_RECEIPT'
              ? `Transfer ${label} sent. The destination warehouse manager can receive it.`
              : `Transfer ${label} completed — stock moved.`,
          )
        } else {
          setNotice(
            nextStatus === 'SELLER_APPROVED'
              ? `Transfer ${label} approved. The warehouse manager can complete it.`
              : `Transfer ${label} approved — stock moved.`,
          )
        }
      }
      await loadTransfers()
      notifyDashboardMenuBadgesChanged()
    } catch (err) {
      setTransfersError(warehouseErrorMessage(err))
    } finally {
      setDecidingId(null)
    }
  }

  const renderActions = (row: WarehouseTransfer) => {
    const busy = decidingId === row.id
    const sellerCanDecide =
      isSeller &&
      row.status === 'PENDING' &&
      Boolean(row.approvalSellerUserId) &&
      !row.fromSellerUserId &&
      !(row.requestedBy && authUserIds.includes(row.requestedBy))
    if (
      row.status === 'PENDING' &&
      (sellerCanDecide ||
        (isWarehouseManager &&
          Boolean(row.fromSellerUserId) &&
          ownedWarehouseIds.has(row.toWarehouseId)))
    ) {
      return (
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            className={approveActionClass}
            disabled={busy}
            onClick={() => void decideTransfer(row, 'approve')}
          >
            <Check size={13} />
            Approve
          </button>
          <button
            type="button"
            className={rejectActionClass}
            disabled={busy}
            onClick={() => void decideTransfer(row, 'reject')}
          >
            <X size={13} />
            Reject
          </button>
        </div>
      )
    }
    if (
      isWarehouseManager &&
      row.status === 'SELLER_APPROVED' &&
      ownedWarehouseIds.has(row.fromWarehouseId ?? '')
    ) {
      return (
        <button
          type="button"
          className={`${approveActionClass} whitespace-nowrap`}
          disabled={busy}
          onClick={() => void decideTransfer(row, 'complete')}
        >
          Complete transfer
        </button>
      )
    }
    if (
      isWarehouseManager &&
      row.status === 'AWAITING_RECEIPT' &&
      ownedWarehouseIds.has(row.toWarehouseId)
    ) {
      return (
        <button
          type="button"
          className={approveActionClass}
          disabled={busy}
          onClick={() => void decideTransfer(row, 'receive')}
        >
          Received
        </button>
      )
    }
    return null
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
      width: '210px',
      render: (row) => renderActions(row),
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

  const pendingColumns: Array<DataTableColumn<WarehouseTransfer>> = [
    {
      key: 'reference',
      header: 'Reference',
      width: '170px',
      render: (row) => (
        <span className="text-xs text-slate-700">{row.referenceId ?? row.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
          {row.fromSellerUserId ? 'Seller inventory' : warehouseName(row.fromWarehouseId ?? '')}
          <ArrowRight size={13} className="text-slate-400" />
          {warehouseName(row.toWarehouseId)}
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <span className="block max-w-[220px] truncate text-sm text-slate-700">
          {productLabel(productNames, row.productId)}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'right',
      width: '80px',
      render: (row) => <span className="font-medium text-slate-900">{row.quantity}</span>,
    },
    {
      key: 'requested',
      header: 'Requested',
      width: '170px',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '190px',
      render: (row) => renderActions(row),
    },
  ]

  const handleSuccess = (message: string) => {
    void reload()
    void loadTransfers()
    notifyDashboardMenuBadgesChanged()
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
            sellerMode={false}
            skipSellerApprovalHint={isSeller}
            onSuccess={() =>
              handleSuccess(
                isSeller
                  ? 'Transfer submitted as Approved. The warehouse manager can complete it.'
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
          <p className="text-sm text-slate-500">
            {base === '/seller'
              ? 'Move received stock between warehouses. Approve warehouse-manager requests here.'
              : copy.description}
          </p>
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

      {pendingApprovals.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              {isSeller ? 'Warehouse transfer requests' : 'Pending transfer approvals'}
            </h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              {pendingApprovals.length} pending
            </span>
          </div>
          <DataTable<WarehouseTransfer>
            columns={pendingColumns}
            rows={pendingApprovals}
            rowKey={(row) => row.id}
            loading={transfersLoading || loading}
            emptyMessage="No transfers waiting for approval."
            emptyIcon={Check}
            initialRowsPerPage={5}
            itemLabel="transfers"
            minWidth="860px"
            fixedLayout
          />
        </section>
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
