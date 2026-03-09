export interface PurchasedOrderItem {
  productId: string
  sku: string
  slug: string
  name: string
  description: string
  imageUrl: string
  quantity: number
  unitPrice: number
  lineTotal: number
  currency: string
}

export interface PurchasedOrderTotals {
  subtotal: number
  total: number
  currency: string
}

export interface PurchasedOrderPayment {
  status: string
  transactionId: string
  failedReason: string
}

export interface PurchasedOrderDelivery {
  deliveryId: string
  status: string
  trackingNumber?: string | null
  trackingUrl?: string | null
  estimatedDeliveryDate?: string | null
}

export interface PurchasedOrderFulfillment {
  status: string
  deliveries: PurchasedOrderDelivery[]
}

export interface PurchasedOrder {
  orderId: string
  status: string
  createdAt?: string | null
  placedAt?: string | null
  items: PurchasedOrderItem[]
  totals: PurchasedOrderTotals
  payment: PurchasedOrderPayment
  fulfillment?: PurchasedOrderFulfillment | null
}
