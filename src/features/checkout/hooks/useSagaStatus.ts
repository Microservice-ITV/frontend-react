import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSagaStatus } from '../store/checkoutThunks'
import { setSagaStatus } from '../store/checkoutSlice'
import type { RootState } from '@/app/store'
import type { SagaStatusResponse } from '../types/sagaTypes'

export const useSagaStatus = (sagaId?: string) => {
  const dispatch = useDispatch()
  const sagaStatus = useSelector((state: RootState) => state.checkout.sagaStatus)
  const loading = useSelector((state: RootState) => state.checkout.loading)

  const fetchStatus = (id: string) => {
    dispatch(fetchSagaStatus(id))
  }

  const clearStatus = () => {
    dispatch(setSagaStatus(null))
  }

  useEffect(() => {
    if (sagaId) {
      fetchStatus(sagaId)
      
      // Poll for status updates
      const interval = setInterval(() => {
        if (sagaId && !['COMPLETED', 'FAILED', 'TIMEOUT'].includes(sagaStatus?.status || '')) {
          fetchStatus(sagaId)
        }
      }, 5000) // Poll every 5 seconds

      return () => clearInterval(interval)
    }
  }, [sagaId])

  return {
    sagaStatus,
    loading,
    fetchStatus,
    clearStatus,
  }
}