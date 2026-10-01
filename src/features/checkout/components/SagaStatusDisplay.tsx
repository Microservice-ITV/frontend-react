import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchSagaStatus, fetchSagaStatusByCheckout } from '../store/checkoutThunks'
import { selectSagaStatus, selectSagaProgress } from '../store/checkoutSlice'
import { Card } from '@/components/ui/Card'
import { RefreshCw, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'

const STEP_META: { name: string; label: string }[] = [
  { name: 'INVENTORY_RESERVATION', label: 'Inventory Reservation' },
  { name: 'PAYMENT_PROCESSING', label: 'Payment Processing' },
  { name: 'SHIPMENT_CREATION', label: 'Shipment Creation' },
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
      return { color: 'bg-green-100 text-green-800' }
    case 'FAILED':
    case 'TIMEOUT':
      return { color: 'bg-red-100 text-red-800' }
    case 'COMPENSATING':
      return { color: 'bg-yellow-100 text-yellow-800' }
    case 'IN_PROGRESS':
      return { color: 'bg-blue-100 text-blue-800' }
    default:
      return { color: 'bg-gray-100 text-gray-800' }
  }
}

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'FAILED':
    case 'TIMEOUT':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'COMPENSATING':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    case 'IN_PROGRESS':
      return <Clock className="h-4 w-4 text-blue-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
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

  const stepStatus = (stepName: string): { status: string; color: string } => {
    if (!sagaStatus) return { status: 'pending', color: 'text-gray-500' }
    if (sagaStatus.completed_steps?.includes(stepName)) {
      return { status: 'Completed', color: 'text-green-600' }
    }
    if (sagaStatus.failed_steps?.includes(stepName)) {
      return { status: 'Failed', color: 'text-red-600' }
    }
    return { status: 'Pending', color: 'text-gray-500' }
  }

  return (
    <div className="mt-6">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(sagaStatus?.status)}
            <h3 className="font-semibold text-gray-900">Order Progress</h3>
            <span
              className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${getStatusStyle(sagaStatus?.status).color}`}
            >
              {sagaStatus ? STATUS_LABEL[sagaStatus.status] ?? sagaStatus.status : 'Tracking…'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {progressPercentage}% complete
            </span>
            <button
              type="button"
              onClick={refresh}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Refresh order progress"
            >
              <RefreshCw
                key={spinKey}
                onAnimationIteration={() => setSpinKey(0)}
                className={`h-4 w-4 text-gray-500 ${spinKey > 0 ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {sagaStatus?.error_message && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              <strong>Error:</strong> {sagaStatus.error_message}
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-2">
          {STEP_META.map((step) => {
            const stepInfo = stepStatus(step.name)
            return (
              <div
                key={step.name}
                className="flex items-center justify-between text-sm px-3 py-2 rounded-md border border-gray-100"
              >
                <span className="font-medium text-gray-700">{step.label}</span>
                <span className={`flex items-center gap-1.5 ${stepInfo.color}`}>
                  {stepInfo.status === 'Completed' && <CheckCircle2 className="h-4 w-4" />}
                  {stepInfo.status === 'Failed' && <XCircle className="h-4 w-4" />}
                  {stepInfo.status === 'Pending' && <Clock className="h-4 w-4" />}
                  {stepInfo.status}
                </span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}