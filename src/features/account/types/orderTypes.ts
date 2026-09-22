export interface PurchasedOrderItem {
  orderItemId?: string
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
  shopId?: string
}

export interface PurchasedOrderTotals {
  subtotal: number
  discount: number
  shipping: number
  total: number
  currency: string
}

export interface PurchasedOrderPayment {
  status: string
  transactionId: string
  failedReason: string
}

export interface PurchasedOrderCourier {
  code?: string | null
  name?: string | null
  phone?: string | null
}

export interface PurchasedOrderDeliveryTimeline {
  createdAt?: string | null
  shippedAt?: string | null
  outForDeliveryAt?: string | null
  deliveredAt?: string | null
  failedAt?: string | null
}

export interface PurchasedOrderDelivery {
  deliveryId: string
  deliveryNumber?: string | null
  courier?: PurchasedOrderCourier | null
  status: string
  trackingNumber?: string | null
  trackingUrl?: string | null
  estimatedDeliveryDate?: string | null
  timeline?: PurchasedOrderDeliveryTimeline | null
}

export interface PurchasedOrderFulfillment {
  status: string
  deliveries: PurchasedOrderDelivery[]
}

export interface PurchasedOrderAddress {
  recipientName?: string | null
  recipientPhone?: string | null
  email?: string | null
  countryCode?: string | null
  country?: string | null
  state?: string | null
  city?: string | null
  district?: string | null
  ward?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  postalCode?: string | null
  deliveryNote?: string | null
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
  deliveryAddress?: PurchasedOrderAddress | null
}
