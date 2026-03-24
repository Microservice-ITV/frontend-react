export type OrderStatus = 'completed' | 'processing' | 'pending' | 'cancelled'

export type Order = {
  id: string
  customer: { name: string; email: string; initials: string }
  product: string
  status: OrderStatus
  date: string
  amount: string
}