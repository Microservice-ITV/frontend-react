import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeftRight, type LucideIcon } from 'lucide-react'
import ModalDrawer from '@/components/ui/ModalDrawer'
import TransferStockForm from '../components/forms/TransferStockForm'
import { secondaryButtonClass } from '../components/forms/FormField'
import { warehousePaths, type WarehouseAreaBase } from '../config/warehousePaths'
import { useWarehouses } from '../hooks/useWarehouseData'
import type { StockOperationKind } from '../types/warehouseTypes'

export type StockOperationPageProps = {
  base: WarehouseAreaBase
  kind: StockOperationKind
}

const OPERATION_COPY: Record<
  StockOperationKind,
  { label: string; title: string; subtitle: string; description: string; icon: LucideIcon; variant: 'modal' | 'drawer'; size: 'md' | 'xl' | 'lg' }
> = {
  transfer: {
    label: 'Transfer',
    title: 'Transfer Stock',
    subtitle: 'Request a transfer between warehouses — waits for approval.',
    description:
      'Pick a source and destination warehouse, then submit the transfer for approval. Stock moves once a warehouse approves it.',
    icon: ArrowLeftRight,
    variant: 'drawer',
    size: 'lg',
  },
}

const StockOperationPage = ({ base, kind }: StockOperationPageProps) => {
  const paths = warehousePaths(base)
  const navigate = useNavigate()
  const copy = OPERATION_COPY[kind]
  const Icon = copy.icon

  const [open, setOpen] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const { warehouses, loading, error, reload } = useWarehouses()

  const handleSuccess = (message: string) => {
    void reload()
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
            onSuccess={() =>
              handleSuccess('Transfer request submitted — pending warehouse approval.')
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
          className={secondaryButtonClass}
          onClick={() => navigate(paths.inventory)}
        >
          Back to inventory
        </button>
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}{' '}
          <button
            type="button"
            className="ml-1 cursor-pointer font-medium underline"
            onClick={() => {
              setNotice(null)
              setOpen(true)
            }}
          >
            Run another
          </button>
        </div>
      )}

      {!notice && !open && (
        <div className="rounded-xl border border-[var(--dni-border)] bg-white p-6 text-center">
          <p className="text-sm text-slate-500">The {copy.label.toLowerCase()} form is closed.</p>
          <button
            type="button"
            className={`${secondaryButtonClass} mt-3`}
            onClick={() => setOpen(true)}
          >
            Open {copy.label.toLowerCase()} form
          </button>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-[var(--dni-border)] bg-white p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--dni-primary-soft)] text-[var(--dni-primary-600)]">
          <Icon size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-800">{copy.title}</p>
          <p className="text-sm text-slate-500">{copy.subtitle}</p>
        </div>
      </div>

      <ModalDrawer
        open={open && !notice}
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
