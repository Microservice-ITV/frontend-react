import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useCart } from '@/features/cart/hooks/useCart'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { 
    checkoutCart, 
    completeCheckout,
    fetchSagaStatus,
    fetchSagaStatistics,
    clearCheckout 
} from '../store/checkoutThunks'
import { 
    selectCurrentCheckout,
    selectSagaStatus,
    selectSagaId,
    selectSagaStatistics,
    selectIsCheckoutLoading,
    selectCheckoutError,
    selectIsSagaCompleted,
    selectIsSagaFailed,
    selectIsSagaInProgress,
    selectSagaProgress
} from '../store/checkoutSlice'
import type { SagaStatusResponse } from '../types/sagaTypes'

export const useCheckout = () => {
  const { items, selectedItems, getTotalPrice } = useCart()
  const { user } = useAuth()
  
  const dispatch = useDispatch()
  const currentCheckout = useSelector(selectCurrentCheckout)
  const sagaStatus = useSelector(selectSagaStatus)
  const sagaId = useSelector(selectSagaId)
  const sagaStatistics = useSelector(selectSagaStatistics)
  const isLoading = useSelector(selectIsCheckoutLoading)
  const error = useSelector(selectCheckoutError)
  const isSagaCompleted = useSelector(selectIsSagaCompleted)
  const isSagaFailed = useSelector(selectIsSagaFailed)
  const isSagaInProgress = useSelector(selectIsSagaInProgress)
  const sagaProgress = useSelector(selectSagaProgress)

  const [showSagaStatus, setShowSagaStatus] = useState(false)

  const handleCheckout = async () => {
    if (!user) return

    try {
      await checkoutCart()
      if (currentCheckout?.saga_id) {
        setShowSagaStatus(true)
        // Start polling for saga status
        pollSagaStatus(currentCheckout.saga_id)
      }
    } catch (error) {
      console.error('Checkout failed:', error)
    }
  }

  const handleCompleteCheckout = async (paymentData?: any) => {
    if (!currentCheckout) return

    try {
      await completeCheckout({
        checkoutId: currentCheckout.checkout_id,
        paymentData
      })
    } catch (error) {
      console.error('Complete checkout failed:', error)
    }
  }

  const pollSagaStatus = (sagaId: string) => {
    const interval = setInterval(() => {
      dispatch(fetchSagaStatus(sagaId))
      
      // Stop polling if saga is completed or failed
      if (isSagaCompleted || isSagaFailed) {
        clearInterval(interval)
      }
    }, 5000) // Poll every 5 seconds

    return interval
  }

  const refreshSagaStatus = () => {
    if (sagaId) {
      dispatch(fetchSagaStatus(sagaId))
    }
    dispatch(fetchSagaStatistics())
  }

  const clearCheckoutState = () => {
    dispatch(clearCheckout())
    setShowSagaStatus(false)
  }

  // Auto-refresh statistics on mount
  useEffect(() => {
    dispatch(fetchSagaStatistics())
  }, [dispatch])

  return {
    // State
    currentCheckout,
    sagaStatus,
    sagaId,
    sagaStatistics,
    isLoading,
    error,
    isSagaCompleted,
    isSagaFailed,
    isSagaInProgress,
    sagaProgress,
    showSagaStatus,
    
    // Actions
    handleCheckout,
    handleCompleteCheckout,
    refreshSagaStatus,
    clearCheckoutState,
    setShowSagaStatus,
    
    // Derived data
    selectedItems,
    totalPrice: getTotalPrice(),
    hasItems: selectedItems.length > 0,
    canCheckout: user && selectedItems.length > 0 && !isLoading,
  }
}