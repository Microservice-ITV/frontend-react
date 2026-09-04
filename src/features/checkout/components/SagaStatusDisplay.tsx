import { useSagaManagement } from '../hooks/useSagaManagement'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'

export const SagaStatusDisplay = ({ sagaId }: { sagaId: string }) => {
  const {
    sagaStatus,
    sagaStatistics,
    isLoading,
    isSagaCompleted,
    isSagaFailed,
    isSagaCompensating,
    isSagaInProgress,
    progressPercentage,
    refreshAll,
  } = useSagaManagement(sagaId)

  const getStatusIcon = () => {
    if (isSagaCompleted) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (isSagaFailed) return <XCircle className="h-4 w-4 text-red-500" />
    if (isSagaCompensating) return <AlertCircle className="h-4 w-4 text-yellow-500" />
    if (isSagaInProgress) return <Clock className="h-4 w-4 text-blue-500" />
    return <Clock className="h-4 w-4 text-gray-500" />
  }

  const getStatusColor = () => {
    if (isSagaCompleted) return 'bg-green-100 text-green-800'
    if (isSagaFailed) return 'bg-red-100 text-red-800'
    if (isSagaCompensating) return 'bg-yellow-100 text-yellow-800'
    if (isSagaInProgress) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getStepStatus = (stepName: string) => {
    if (!sagaStatus) return null
    
    if (sagaStatus.completed_steps?.includes(stepName)) {
      return { status: 'completed', color: 'text-green-600' }
    }
    if (sagaStatus.failed_steps?.includes(stepName)) {
      return { status: 'failed', color: 'text-red-600' }
    }
    return { status: 'pending', color: 'text-gray-600' }
  }

  const steps = [
    { name: 'INVENTORY_RESERVATION', label: 'Inventory Reservation' },
    { name: 'PAYMENT_PROCESSING', label: 'Payment Processing' },
    { name: 'SHIPMENT_CREATION', label: 'Shipment Creation' },
  ]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading Saga Status...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Saga Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span>Saga Status</span>
            </div>
            <button
              onClick={refreshAll}
              className="p-1 hover:bg-gray-100 rounded"
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sagaStatus && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor()}>
                  {sagaStatus.status}
                </Badge>
                <span className="text-sm text-gray-600">
                  {progressPercentage}% Complete
                </span>
              </div>
              
              <Progress value={progressPercentage} className="h-2" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Current Step:</span>
                  <p className="text-gray-600">{sagaStatus.current_step || 'Not started'}</p>
                </div>
                <div>
                  <span className="font-medium">Total Steps:</span>
                  <p className="text-gray-600">{sagaStatus.total_steps}</p>
                </div>
                <div>
                  <span className="font-medium">Compensation:</span>
                  <p className="text-gray-600">
                    {sagaStatus.compensation_required ? 'Required' : 'Not required'}
                  </p>
                </div>
              </div>

              {sagaStatus.error_message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">
                    <strong>Error:</strong> {sagaStatus.error_message}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Step Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step) => {
              const stepStatus = getStepStatus(step.name)
              return (
                <div key={step.name} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="font-medium">{step.label}</span>
                  <div className="flex items-center gap-2">
                    {stepStatus && (
                      <>
                        <span className={`text-sm ${stepStatus.color}`}>
                          {stepStatus.status}
                        </span>
                        {stepStatus.status === 'failed' && (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Saga Statistics Card */}
      {sagaStatistics && (
        <Card>
          <CardHeader>
            <CardTitle>Saga Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Sagas:</span>
                <p className="text-gray-600">{sagaStatistics.total_sagas}</p>
              </div>
              <div>
                <span className="font-medium">Active:</span>
                <p className="text-gray-600">{sagaStatistics.active_sagas}</p>
              </div>
              <div>
                <span className="font-medium">Completed:</span>
                <p className="text-gray-600">{sagaStatistics.completed_sagas}</p>
              </div>
              <div>
                <span className="font-medium">Failed:</span>
                <p className="text-gray-600">{sagaStatistics.failed_sagas}</p>
              </div>
              <div>
                <span className="font-medium">Compensating:</span>
                <p className="text-gray-600">{sagaStatistics.compensating_sagas}</p>
              </div>
              <div>
                <span className="font-medium">Success Rate:</span>
                <p className="text-gray-600">{sagaStatistics.success_rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}