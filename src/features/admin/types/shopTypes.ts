export type AdminShopStatus = 'pending' | 'active' | 'inactive'

export type AdminShopRow = {
  id: string
  name: string
  description: string
  slug: string
  status: AdminShopStatus
  /** Shop owner display from product-service (pending review). */
  ownerLabel: string
  created: string
  updated: string
}

export type AdminShopsState = {
  items: AdminShopRow[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  moderationStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  moderationError: string | null
}