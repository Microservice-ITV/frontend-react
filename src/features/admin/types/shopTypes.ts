export type ShopStatus = 'active' | 'inactive'

export type AdminShopRow = {
  id: string
  name: string
  description: string
  slug: string
  status: ShopStatus
  created: string
  updated: string
}

export type AdminShopsState = {
  items: AdminShopRow[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}