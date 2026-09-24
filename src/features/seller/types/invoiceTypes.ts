export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'rejected' | 'void' | 'refunded'

export type Invoice = {
  id: string
  customer: { name: string; email: string }
  orderId: string
  status: InvoiceStatus
  issued: string
  amount: string
  currency: string
  pdfUrl: string | null
}