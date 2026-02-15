export interface CheckoutResponse {
    checkout_id: string
    message: string
    status?: number
    expire_at?: string | null
}