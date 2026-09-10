# Saga Pattern Implementation - Frontend Integration

This document describes how to integrate the saga pattern implementation from the backend into the frontend React application.

## Overview

The frontend has been updated to support the new saga-based checkout system, providing real-time status updates and comprehensive saga monitoring.

## Updated Components

### 1. Checkout API (`src/features/checkout/api/checkoutApi.ts`)

```typescript
export const checkoutApi = {
  // New saga-based checkout endpoint
  createCheckoutSession(data: {
    user_id: string
    items: { product_id: string; qty: number; variant_id?: string }[]
    idempotency_key: string
    delivery_address?: any
  }): Promise<AxiosResponse<SagaCheckoutResponse>>

  // Complete checkout with payment data
  completeCheckoutSession(checkoutId: string, paymentData?: any): Promise<AxiosResponse<any>>

  // Get saga status
  getSagaStatus(sagaId: string): Promise<AxiosResponse<SagaStatusResponse>>

  // Get saga statistics
  getSagaStatistics(): Promise<AxiosResponse<any>>
}
```

### 2. Saga Types (`src/features/checkout/types/sagaTypes.ts`)

```typescript
export interface SagaStatusResponse {
    saga_id: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'COMPENSATING' | 'FAILED' | 'TIMEOUT'
    type: string
    order_id?: string
    correlation_id?: string
    current_step?: number
    total_steps: number
    completed_steps: string[]
    failed_steps: string[]
    compensation_required: boolean
    error_message?: string
    started_at?: string
    completed_at?: string
    timeout_at?: string
}

export interface SagaCheckoutResponse {
    checkout: any
    existing: boolean
    saga_id?: string
    message: string
}
```

### 3. Checkout Thunks (`src/features/checkout/store/checkoutThunks.ts`)

Updated thunks for saga operations:

- `checkoutCart` - Creates a new saga-based checkout
- `completeCheckout` - Completes the checkout process
- `fetchSagaStatus` - Fetches saga status
- `fetchSagaStatistics` - Fetches saga statistics

### 4. Checkout Slice (`src/features/checkout/store/checkoutSlice.ts`)

Enhanced state management with:

- Saga status tracking
- Saga statistics
- Progress calculation
- Error handling

### 5. Custom Hooks

#### `useCheckout`
Main hook for checkout operations:

```typescript
const {
  currentCheckout,
  sagaStatus,
  sagaId,
  isLoading,
  error,
  handleCheckout,
  handleCompleteCheckout,
  refreshSagaStatus,
  canCheckout
} = useCheckout()
```

#### `useSagaStatus`
Hook for saga status monitoring:

```typescript
const { sagaStatus, loading, fetchStatus } = useSagaStatus(sagaId)
```

#### `useSagaStatistics`
Hook for saga statistics:

```typescript
const { sagaStatistics, loading, fetchStatistics } = useSagaStatistics()
```

#### `useSagaManagement`
Combined hook for comprehensive saga management:

```typescript
const {
  sagaStatus,
  sagaStatistics,
  isSagaCompleted,
  isSagaFailed,
  progressPercentage,
  refreshAll
} = useSagaManagement(sagaId)
```

### 6. UI Components

#### `SagaCheckoutForm`
Main checkout form with saga integration:

```typescript
<SagaCheckoutForm />
```

Features:
- Order summary
- Delivery address form
- Payment method selection
- Real-time saga status display
- Progress tracking

#### `SagaStatusDisplay`
Comprehensive saga status display:

```typescript
<SagaStatusDisplay sagaId={sagaId} />
```

Features:
- Current saga status with visual indicators
- Step-by-step progress tracking
- Error display and handling
- Saga statistics overview
- Auto-refresh functionality

## Usage Example

### Basic Checkout Flow

```typescript
import { useCheckout } from '@/features/checkout/hooks/useCheckout'

function CheckoutPage() {
  const {
    currentCheckout,
    sagaStatus,
    isLoading,
    error,
    handleCheckout,
    canCheckout
  } = useCheckout()

  return (
    <div>
      <button 
        onClick={handleCheckout}
        disabled={!canCheckout}
      >
        {isLoading ? 'Processing...' : 'Complete Order'}
      </button>

      {error && <div className="error">{error}</div>}
      
      {currentCheckout?.saga_id && (
        <SagaStatusDisplay sagaId={currentCheckout.saga_id} />
      )}
    </div>
  )
}
```

### Advanced Saga Monitoring

```typescript
import { useSagaManagement } from '@/features/checkout/hooks/useSagaManagement'

function SagaMonitor() {
  const {
    sagaStatus,
    sagaStatistics,
    isSagaCompleted,
    isSagaFailed,
    progressPercentage,
    refreshAll
  } = useSagaManagement(sagaId)

  if (isSagaCompleted) {
    return <div>Order completed successfully!</div>
  }

  if (isSagaFailed) {
    return <div>Order failed. Please try again.</div>
  }

  return (
    <div>
      <div>Progress: {progressPercentage}%</div>
      <button onClick={refreshAll}>Refresh Status</button>
    </div>
  )
}
```

## Docker Configuration

### Updated `docker-compose.yml`

Added two new services for automatic saga management:

1. **order-saga-manager** - Processes saga timeouts every 5 minutes
2. **order-saga-stats** - Cleans up old sagas daily

```yaml
order-saga-manager:
  # ... configuration
  entrypoint: >
    sh -c "
      while true; do
        echo "Running saga timeout processing at \$(date)"
        php artisan saga:manage process-timeouts --limit=50
        sleep 300
      done
    "

order-saga-stats:
  # ... configuration
  entrypoint: >
    sh -c "
      while true; do
        echo "Running saga statistics cleanup at \$(date)"
        php artisan saga:manage cleanup-old-sagas --days=7
        sleep 86400
      done
    "
```

## Key Features

### 1. Real-time Status Updates
- Automatic polling for saga status updates
- Progress tracking with visual indicators
- Error handling and recovery

### 2. Comprehensive Monitoring
- Step-by-step progress display
- Success rate tracking
- Failure analysis
- Performance metrics

### 3. User Experience
- Seamless integration with existing checkout flow
- Clear status indicators
- Automatic refresh
- Error recovery

### 4. Performance
- Optimized polling intervals
- Caching of statistics
- Efficient state management

## Error Handling

### Common Error Scenarios

1. **Saga Timeout**
   - Automatic retry mechanism
   - User notification
   - Fallback options

2. **Payment Failure**
   - Graceful degradation
   - Retry options
   - Error display

3. **Inventory Issues**
   - Real-time updates
   - Alternative suggestions
   - Automatic compensation

## Testing

### Unit Tests
```bash
npm test -- --testPathPattern="checkout"
```

### Integration Tests
```bash
npm test -- --testPathPattern="saga"
```

### Component Tests
```bash
npm test -- --testPathPattern="SagaStatusDisplay"
```

## Migration Guide

### For Existing Applications

1. **Update API calls** to use new saga endpoints
2. **Add saga status monitoring** components
3. **Update state management** with saga-related data
4. **Add error handling** for saga-specific scenarios
5. **Configure docker services** for automatic management

### Breaking Changes

- `checkoutCart` now returns `SagaCheckoutResponse` instead of `CheckoutResponse`
- New `saga_id` field in checkout responses
- Additional status fields in checkout state

## Best Practices

1. **Use the provided hooks** for consistent state management
2. **Implement proper error boundaries** for saga components
3. **Monitor saga performance** and adjust polling intervals
4. **Provide user feedback** for long-running operations
5. **Handle edge cases** like saga timeouts and failures

## Performance Considerations

- Polling intervals should be balanced between responsiveness and performance
- Cache saga statistics to avoid unnecessary API calls
- Use memoization for expensive calculations
- Implement proper cleanup of intervals and timeouts

This implementation provides a robust, user-friendly interface for the saga-based checkout system while maintaining the existing functionality of the application.