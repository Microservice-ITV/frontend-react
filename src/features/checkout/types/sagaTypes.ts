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

export interface SagaStatisticsResponse {
    total_sagas: number
    active_sagas: number
    completed_sagas: number
    failed_sagas: number
    compensating_sagas: number
    success_rate: number
}

export interface SagaCheckoutResponse {
    checkout: any
    existing: boolean
    saga_id?: string
    checkout_id?: string
    message: string
    checkout_attempt_count?: number
}