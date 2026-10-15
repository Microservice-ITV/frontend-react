import { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import { StepConnector } from '@/components/ui/StepConnector'
import type { PurchaseOrder } from '../types/purchaseTypes'
import { PURCHASE_ORDER_STATUS_LABELS } from '../types/purchaseTypes'

type StepState = 'completed' | 'active' | 'pending'

type TrackStep = {
  key: string
  title: string
  icon: LucideIcon
  kind: 'route' | 'pickup' | 'warehouse'
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'WAREHOUSE_RECEIVED':
    case 'SELLER_RECEIVED':
    case 'ARRIVED':
      return 'bg-emerald-100 text-emerald-800'
    case 'IN_TRANSIT':
    case 'ORDERED':
    case 'DELIVERY_PICKED_UP':
      return 'bg-blue-100 text-blue-800'
    case 'AWAITING_WAREHOUSE_RECEIPT':
    case 'AWAITING_SELLER_RECEIPT':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'WAREHOUSE_RECEIVED':
    case 'SELLER_RECEIVED':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    case 'ARRIVED':
      return <MapPin className="h-4 w-4 text-emerald-600" />
    case 'IN_TRANSIT':
    case 'ORDERED':
      return <Truck className="h-4 w-4 text-blue-500" />
    case 'DELIVERY_PICKED_UP':
    case 'AWAITING_WAREHOUSE_RECEIPT':
      return <Package className="h-4 w-4 text-amber-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

const statusWord = (state: StepState) => {
  if (state === 'completed') return 'Completed'
  if (state === 'active') return 'In progress'
  return 'Pending'
}

const buildSteps = (order: PurchaseOrder): TrackStep[] => {
  const stops = [...(order.routeStops ?? [])].sort((a, b) => a.sequence - b.sequence)
  const routeSteps: TrackStep[] = stops.map((stop, index) => ({
    key: `route-${stop.id}`,
    title: stop.location,
    icon: index === 0 ? Package : index === stops.length - 1 ? MapPin : Truck,
    kind: 'route',
  }))
  return [
    ...routeSteps,
    { key: 'pickup', title: 'Delivery pickup', icon: Truck, kind: 'pickup' },
    { key: 'warehouse', title: 'Warehouse received', icon: Warehouse, kind: 'warehouse' },
  ]
}

const stepStatesForOrder = (order: PurchaseOrder, steps: TrackStep[]): StepState[] => {
  const stops = [...(order.routeStops ?? [])].sort((a, b) => a.sequence - b.sequence)

  if (
    order.status === 'WAREHOUSE_RECEIVED' ||
    order.status === 'SELLER_RECEIVED' ||
    order.status === 'RECEIVED'
  ) {
    return steps.map(() => 'completed')
  }

  return steps.map((step, index) => {
    if (step.kind === 'route') {
      const stop = stops[index]
      if (stop?.arrivedAt) return 'completed'
      // Origin is treated as started; destination of current leg is active.
      const leg = order.routeLegIndex ?? 0
      if (
        (order.status === 'IN_TRANSIT' || order.status === 'ORDERED') &&
        index === leg + 1
      ) {
        return 'active'
      }
      return 'pending'
    }

    if (step.kind === 'pickup') {
      if (
        order.status === 'DELIVERY_PICKED_UP' ||
        order.status === 'AWAITING_WAREHOUSE_RECEIPT' ||
        order.status === 'AWAITING_SELLER_RECEIPT'
      ) {
        return 'completed'
      }
      if (order.status === 'ARRIVED') return 'active'
      return 'pending'
    }

    // warehouse
    if (order.status === 'DELIVERY_PICKED_UP') return 'active'
    if (
      order.status === 'AWAITING_WAREHOUSE_RECEIPT' ||
      order.status === 'AWAITING_SELLER_RECEIPT'
    ) {
      return 'active'
    }
    return 'pending'
  })
}

type Props = {
  order: PurchaseOrder
  busy?: boolean
  onRefresh?: () => void
  onMarkArrived?: () => void
}

export const PurchaseOrderRouteStatusDisplay = ({
  order,
  busy = false,
  onRefresh,
  onMarkArrived,
}: Props) => {
  const [spinKey, setSpinKey] = useState(0)

  const steps = useMemo(() => buildSteps(order), [order])
  const states = useMemo(() => stepStatesForOrder(order, steps), [order, steps])

  const allComplete = states.every((state) => state === 'completed')
  const activeIndex = states.findIndex((state) => state === 'active')
  const reachIndex = allComplete ? steps.length - 1 : Math.max(activeIndex, 0)
  const reach = steps.length <= 1 ? 1 : allComplete ? 1 : reachIndex / (steps.length - 1)
  const flowing = states.some((state) => state === 'active') && !allComplete && reachIndex > 0

  const progressPercentage = allComplete
    ? 100
    : Math.round((states.filter((state) => state === 'completed').length / Math.max(steps.length, 1)) * 100)

  const stops = [...(order.routeStops ?? [])].sort((a, b) => a.sequence - b.sequence)
  const leg = order.routeLegIndex ?? 0
  const nextStop = stops[leg + 1]
  const canMarkArrived =
    Boolean(onMarkArrived) &&
    Boolean(nextStop) &&
    ['IN_TRANSIT', 'ORDERED'].includes(order.status)

  const refresh = () => {
    setSpinKey((key) => key + 1)
    onRefresh?.()
  }

  const statusLabel =
    PURCHASE_ORDER_STATUS_LABELS[order.status] ?? order.status

  return (
    <div className="w-full space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {getStatusIcon(order.status)}
            <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
            <span
              className={clsx(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                getStatusStyle(order.status),
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="truncate text-xs text-gray-500">
            {order.supplier?.name ?? 'Supplier order'}
            {order.warehouse?.name ? ` · ${order.warehouse.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{progressPercentage}% complete</span>
          {onRefresh && (
            <button
              type="button"
              onClick={refresh}
              className="rounded p-1 transition-colors hover:bg-gray-100"
              aria-label="Refresh order progress"
            >
              <RefreshCw
                key={spinKey}
                onAnimationIteration={() => setSpinKey(0)}
                className={clsx('h-4 w-4 text-gray-500', spinKey > 0 && 'animate-spin')}
              />
            </button>
          )}
        </div>
      </div>

      {steps.length > 0 ? (
        <div className="relative flex w-full items-start justify-between">
          <StepConnector
            stepCount={steps.length}
            reach={reach}
            flowing={flowing}
            colorClass="bg-emerald-600"
          />

          {steps.map((step, index) => {
            const state = states[index] ?? 'pending'
            const emphasized = state === 'completed' || state === 'active'
            const Icon = step.icon

            return (
              <div key={step.key} className="relative flex flex-1 flex-col items-center">
                <div
                  className={clsx(
                    'relative z-10 flex h-9 w-9 items-center justify-center shadow-sm transition-all duration-300',
                    state === 'active' && 'scale-105 rounded-full bg-emerald-600 text-white',
                    state === 'completed' && 'rounded-full bg-emerald-600 text-white',
                    state === 'pending' && 'rounded-lg bg-gray-100 text-gray-400',
                  )}
                >
                  {state === 'completed' ? (
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                <div className="mt-3 select-none space-y-1 px-1 text-center">
                  <p
                    className={clsx(
                      'text-xs font-medium leading-tight transition-colors duration-300 sm:text-sm',
                      emphasized ? 'font-semibold text-gray-900' : 'text-gray-400',
                    )}
                  >
                    {step.title}
                  </p>
                  <p
                    className={clsx(
                      'text-[11px] font-medium transition-colors duration-300 sm:text-xs',
                      state === 'completed' && 'text-emerald-700',
                      state === 'active' && 'text-emerald-700',
                      state === 'pending' && 'text-gray-400',
                    )}
                  >
                    {statusWord(state)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No transit route was set on this order.</p>
      )}

      {canMarkArrived && nextStop && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 px-4 py-3">
          <p className="text-sm text-emerald-900">
            Confirm arrival at <span className="font-semibold">{nextStop.location}</span> to advance
            the next transit leg.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => onMarkArrived?.()}
            className="inline-flex cursor-pointer items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? 'Updating…' : `Arrived to ${nextStop.location}`}
          </button>
        </div>
      )}

      {order.status === 'ARRIVED' && (
        <p className="text-sm text-emerald-700">
          Final stop reached. Waiting for the delivery agent to pick up the parcel.
        </p>
      )}
      {(order.status === 'DELIVERY_PICKED_UP' ||
        order.status === 'AWAITING_WAREHOUSE_RECEIPT' ||
        order.status === 'AWAITING_SELLER_RECEIPT') && (
        <p className="text-sm text-amber-800">
          Delivery agent is handling the parcel. The warehouse manager will post the goods receipt.
        </p>
      )}
      {(order.status === 'WAREHOUSE_RECEIVED' || order.status === 'SELLER_RECEIVED') && (
        <p className="text-sm font-medium text-emerald-700">
          Warehouse successfully received your products.
        </p>
      )}
    </div>
  )
}

export default PurchaseOrderRouteStatusDisplay
