export interface CheckoutResponse {
    checkout_id: string
    message: string
    status?: number
    expire_at?: string | null
}

export type CheckoutPaymentStatus =
    | 'PROCESSING'
    | 'PAYMENT_INTENT_READY'
    | 'PAYMENT_PENDING_CONFIRMATION'
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'COMPLETED'
    | 'FAILED'
    | 'FAILED_PAYMENT'
    | 'EXPIRED'

export interface CheckoutStatusResponse {
    checkout_id: string
    status: CheckoutPaymentStatus
    client_secret?: string
    expire_at?: string | null
    message?: string
}