import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSagaStatistics } from '../store/checkoutThunks'
import { setSagaStatistics } from '../store/checkoutSlice'
import type { RootState } from '@/app/store'

export const useSagaStatistics = () => {
  const dispatch = useDispatch()
  const sagaStatistics = useSelector((state: RootState) => state.checkout.sagaStatistics)
  const loading = useSelector((state: RootState) => state.checkout.loading)

  const fetchStatistics = () => {
    dispatch(fetchSagaStatistics())
  }

  const clearStatistics = () => {
    dispatch(setSagaStatistics(null))
  }

  useEffect(() => {
    // Auto-fetch statistics when component mounts
    if (!sagaStatistics) {
      fetchStatistics()
    }
  }, [sagaStatistics])

  return {
    sagaStatistics,
    loading,
    fetchStatistics,
    clearStatistics,
  }
}