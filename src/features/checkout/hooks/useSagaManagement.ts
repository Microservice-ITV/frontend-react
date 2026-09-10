import { useSagaStatus } from './useSagaStatus'
import { useSagaStatistics } from './useSagaStatistics'

export const useSagaManagement = (sagaId?: string) => {
  const { sagaStatus, loading: statusLoading, fetchStatus, clearStatus } = useSagaStatus(sagaId)
  const { sagaStatistics, loading: statsLoading, fetchStatistics, clearStatistics } = useSagaStatistics()

  const isLoading = statusLoading || statsLoading

  const refreshAll = () => {
    if (sagaId) {
      fetchStatus(sagaId)
    }
    fetchStatistics()
  }

  const clearAll = () => {
    clearStatus()
    clearStatistics()
  }

  const isSagaCompleted = sagaStatus?.status === 'COMPLETED'
  const isSagaFailed = sagaStatus?.status === 'FAILED'
  const isSagaCompensating = sagaStatus?.status === 'COMPENSATING'
  const isSagaInProgress = sagaStatus?.status === 'IN_PROGRESS'

  const getProgressPercentage = () => {
    if (!sagaStatus) return 0
    if (sagaStatus.status === 'COMPLETED') return 100
    if (sagaStatus.status === 'FAILED') return 0
    
    const completed = sagaStatus.completed_steps?.length || 0
    const total = sagaStatus.total_steps || 1
    return Math.round((completed / total) * 100)
  }

  return {
    sagaStatus,
    sagaStatistics,
    isLoading,
    isSagaCompleted,
    isSagaFailed,
    isSagaCompensating,
    isSagaInProgress,
    progressPercentage: getProgressPercentage(),
    refreshAll,
    clearAll,
    fetchStatus,
    fetchStatistics,
  }
}