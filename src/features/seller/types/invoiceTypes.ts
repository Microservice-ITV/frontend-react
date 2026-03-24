export type InvoiceStatus = 'paid' | 'pending' | 'overdue'

export type Invoice = {
  id: string
  customer: { name: string; email: string }
  orderId: string
  status: InvoiceStatus
  issued: string
  due: string
  amount: string
}