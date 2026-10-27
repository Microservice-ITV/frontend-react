export interface CheckoutResponse {
    checkout_id: string
    message: string
    status?: number
    expire_at?: string | null
    saga_id?: string
    existing?: boolean
    checkout_attempt_count?: number
}

export type CheckoutPaymentStatus =
    | 'PROCESSING'
    | 'PAYMENT_INTENT_READY'
    | 'PAYMENT_PENDING_CONFIRMATION'
    | 'PENDING_STOCK'
    | 'STOCK_CONFIRMED'
    | 'FAILED_STOCK'
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'COMPLETED'
    | 'FAILED'
    | 'FAILED_PAYMENT'
    | 'EXPIRED'

export interface CheckoutStatusResponse {
    checkout_id: string
    status: CheckoutPaymentStatus
    payment_method?: string
    client_secret?: string
    payment?: {
        payment_id: string
        client_secret?: string
    } | null
    expire_at?: string | null
    message?: string
    items?: Array<{
        product_id: string
        variant_id?: string | null
        shop_id?: string | null
        qty: number
    }>
}
