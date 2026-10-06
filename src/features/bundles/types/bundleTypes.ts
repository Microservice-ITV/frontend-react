export type BundleKind = 'FIXED' | 'ADDON' | 'CART_UPSELL'

export const BUNDLE_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'] as const
export type BundleStatus = (typeof BUNDLE_STATUSES)[number]

export type BundleItemRole = 'INCLUDED' | 'ADDON' | 'TRIGGER' | 'OFFER'

export interface BundleProductView {
  id: string
  name: string
  slug: string
  price: number
  image: string | null
  shopId: string | null
  shopName: string | null
  categoryId: string | null
}

export interface BundleItem {
  id?: string
  productId: string
  quantity: number
  role: BundleItemRole
  offerPrice: number | null
  sortOrder: number
  product?: BundleProductView
}

export interface BundleRecord {
  id: string
  shopId: string
  title: string
  description: string | null
  slug: string
  kind: BundleKind
  status: BundleStatus
  bundlePrice: number | null
  anchorProductId: string | null
  anchor?: BundleProductView | null
  startAt: string | null
  endAt: string | null
  createdAt: string
  updatedAt: string
  items: BundleItem[]
  individualTotal?: number
  savings?: number
}

export interface BundleUpsertPayload {
  shopId: string
  title: string
  description?: string | null
  kind: BundleKind
  bundlePrice?: number | null
  anchorProductId?: string | null
  startAt?: string | null
  endAt?: string | null
  items: Array<{
    productId: string
    quantity: number
    role: BundleItemRole
    offerPrice?: number | null
    sortOrder: number
  }>
}

export interface BundleMatchDiscount {
  bundle_id: string
  title: string
  kind: 'FIXED' | 'CART_UPSELL'
  shop_id: string
  amount: number
  sets: number
}

export interface BundleOfferItem {
  product_id: string
  name: string
  image: string | null
  price: number
  quantity: number
  in_cart: boolean
}

export interface BundleOffer {
  bundle_id: string
  title: string
  description?: string | null
  bundle_price: number | null
  individual_total: number
  savings: number
  shop_id: string
  complete: boolean
  amount: number
  items: BundleOfferItem[]
}

export interface BundleMatchResult {
  discount_total: number
  discounts: BundleMatchDiscount[]
  offers?: BundleOffer[]
}
