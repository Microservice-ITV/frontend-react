import { useState } from 'react'
import clsx from 'clsx'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  RefreshCw,
  Truck,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { StepConnector } from '@/components/ui/StepConnector'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchSagaStatus, fetchSagaStatusByCheckout } from '../store/checkoutThunks'
import { selectSagaProgress, selectSagaStatus } from '../store/checkoutSlice'
import type { SagaStatusResponse } from '../types/sagaTypes'

type StepState = 'completed' | 'active' | 'failed' | 'pending'

interface OrderStep {
  name: string
  title: string
  icon: LucideIcon
}

const STEPS: OrderStep[] = [
  {
    name: 'INVENTORY_RESERVATION',
    title: 'Inventory Reservation',
    icon: Package,
  },
  {
    name: 'PAYMENT_PROCESSING',
    title: 'Payment Processing',
    icon: CreditCard,
  },
  {
    name: 'SHIPMENT_CREATION',
    title: 'Shipment Creation',
    icon: Truck,
  },
]

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Waiting to start',
  IN_PROGRESS: 'Processing your order',
  COMPENSATING: 'Rolling back — something went wrong',
  COMPLETED: 'Order placed successfully',
  FAILED: 'Order failed',
  TIMEOUT: 'Order timed out',
}

const getStatusStyle = (status?: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800'
    case 'FAILED':
    case 'TIMEOUT':
      return 'bg-red-100 text-red-800'
    case 'COMPENSATING':
      return 'bg-amber-100 text-amber-800'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    case 'FAILED':
    case 'TIMEOUT':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'COMPENSATING':
      return <AlertCircle className="h-4 w-4 text-amber-500" />
    case 'IN_PROGRESS':
      return <Clock className="h-4 w-4 text-blue-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

const stepStates = (sagaStatus: SagaStatusResponse | null): StepState[] => {
  if (sagaStatus?.status === 'COMPLETED') {
    return STEPS.map(() => 'completed')
  }

  const completed = new Set(sagaStatus?.completed_steps ?? [])
  const failed = new Set(sagaStatus?.failed_steps ?? [])
  const status = sagaStatus?.status
  const running = status === 'IN_PROGRESS' || status === 'COMPENSATING'
  const terminalFailure = status === 'FAILED' || status === 'TIMEOUT'

  let activeIndex = STEPS.findIndex((step) => failed.has(step.name))
  if (activeIndex < 0) {
    activeIndex = STEPS.findIndex((step) => !completed.has(step.name))
  }

  return STEPS.map((step, index) => {
    if (completed.has(step.name)) return 'completed'
    if (failed.has(step.name) || (terminalFailure && index === activeIndex)) return 'failed'
    if (running && index === activeIndex) return 'active'
    return 'pending'
  })
}

const statusWord = (state: StepState, compensating: boolean) => {
  if (compensating && state === 'active') return 'Rolling back'
  if (state === 'completed') return 'Completed'
  if (state === 'failed') return 'Failed'
  if (state === 'active') return 'Processing'
  return 'Pending'
}

export const SagaStatusDisplay = ({ sagaId, checkoutId }: { sagaId?: string; checkoutId?: string }) => {
  const dispatch = useAppDispatch()
  const sagaStatus = useAppSelector(selectSagaStatus)
  const progressPercentage = useAppSelector(selectSagaProgress)
  const [spinKey, setSpinKey] = useState(0)

  const refresh = () => {
    setSpinKey((key) => key + 1)
    if (checkoutId) {
      void dispatch(fetchSagaStatusByCheckout(checkoutId))
    } else {
      void dispatch(fetchSagaStatus(sagaId as string))
    }
  }

  const states = stepStates(sagaStatus)
  const compensating = sagaStatus?.status === 'COMPENSATING'
  const lineFailed = states.some((state) => state === 'failed')
  const allComplete = states.every((state) => state === 'completed')
  const activeIndex = states.findIndex((state) => state === 'active' || state === 'failed')
  const reachIndex = allComplete ? STEPS.length - 1 : Math.max(activeIndex, 0)
  const reach = allComplete ? 1 : reachIndex / (STEPS.length - 1)
  const flowing = states.some((state) => state === 'active') && !compensating && !lineFailed && reachIndex > 0

  return (
    <div className="mt-6">
      <div className="w-full space-y-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {getStatusIcon(sagaStatus?.status)}
            <h3 className="font-semibold text-gray-900">Order Progress</h3>
            <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', getStatusStyle(sagaStatus?.status))}>
              {sagaStatus ? STATUS_LABEL[sagaStatus.status] ?? sagaStatus.status : 'Tracking…'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{progressPercentage}% complete</span>
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
          </div>
        </div>

        <div className="relative flex w-full items-start justify-between">
          <StepConnector
            stepCount={STEPS.length}
            reach={reach}
            flowing={flowing}
            colorClass={lineFailed ? 'bg-red-500' : compensating ? 'bg-amber-500' : 'bg-emerald-600'}
          />

          {STEPS.map((step, index) => {
            const state = states[index]
            const emphasized = state === 'completed' || state === 'active' || state === 'failed'
            const Icon = step.icon

            return (
              <div key={step.name} className="relative flex flex-1 flex-col items-center">
                <div
                  className={clsx(
                    'relative z-10 flex h-9 w-9 items-center justify-center shadow-sm transition-all duration-300',
                    state === 'failed' && 'scale-105 rounded-full bg-red-600 text-white',
                    state === 'active' && compensating && 'scale-105 rounded-full bg-amber-500 text-white',
                    state === 'active' && !compensating && 'scale-105 rounded-full bg-emerald-600 text-white',
                    state === 'completed' && 'rounded-full bg-emerald-600 text-white',
                    state === 'pending' && 'rounded-lg bg-gray-100 text-gray-400',
                  )}
                >
                  {state === 'completed' ? (
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  ) : state === 'failed' ? (
                    <X className="h-5 w-5" strokeWidth={2.5} />
                  ) : compensating && state === 'active' ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                <div className="mt-3 select-none space-y-1 px-1 text-center">
                  <p
                    className={clsx(
                      'text-xs font-medium leading-tight transition-colors duration-300 sm:text-sm',
                      state === 'failed'
                        ? 'font-semibold text-red-700'
                        : emphasized
                          ? 'font-semibold text-gray-900'
                          : 'text-gray-400',
                    )}
                  >
                    {step.title}
                  </p>
                  <p
                    className={clsx(
                      'inline-flex items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-300 sm:text-xs',
                      state === 'completed' && 'text-emerald-700',
                      state === 'active' && !compensating && 'text-emerald-700',
                      state === 'active' && compensating && 'text-amber-700',
                      state === 'failed' && 'text-red-600',
                      state === 'pending' && 'text-gray-400',
                    )}
                  >
                    {state === 'active' && !compensating && (
                      <span
                        className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
                        aria-hidden="true"
                      />
                    )}
                    {statusWord(state, compensating)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {sagaStatus?.error_message && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">
              <strong>Error:</strong> {sagaStatus.error_message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
