export interface FlashDealItem {
  id: string
  productId: string
  variantId: string | null
  originalPrice: number
  dealPrice: number
  allocatedQuantity: number
  soldQuantity: number
  purchaseLimit: number
  sortOrder: number
  remainingQuantity: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: string[]
    categoryId: string
    categoryName: string
    categorySlug: string
  }
}

export type FlashDealStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'PAUSED'

export interface FlashDeal {
  id: string
  name: string
  description: string | null
  status: FlashDealStatus
  slotTime: string | null
  startAt: string
  endAt: string
  createdAt: string
  updatedAt: string
  items: FlashDealItem[]
}

export interface FlashDealsResponse {
  success: boolean
  data: FlashDeal[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FlashDealResponse {
  success: boolean
  data: FlashDeal
}

export interface CreateFlashDealPayload {
  name: string
  description?: string | null
  status?: FlashDealStatus
  slotTime?: string | null
  startAt: string
  endAt: string
  items: CreateFlashDealItemPayload[]
}

export interface CreateFlashDealItemPayload {
  productId: string
  variantId?: string | null
  originalPrice: number
  dealPrice: number
  allocatedQuantity: number
  purchaseLimit: number
  sortOrder?: number
}

export interface UpdateFlashDealPayload {
  name?: string
  description?: string | null
  status?: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'PAUSED'
  slotTime?: string | null
  startAt?: string
  endAt?: string
  items?: CreateFlashDealItemPayload[]
}

export interface UpdateFlashDealStockPayload {
  items: Array<{
    itemId: string
    allocatedQuantity: number
  }>
}

export interface StorefrontFlashDealItem {
  id: string
  flashDealId: string
  flashDealName: string
  name: string
  image: string
  tag: string
  dealPrice: number
  originalPrice: number
  discount: number
  sold: string
  stockText: string
  stockProgress: number
  remainingQuantity: number
  soldOut: boolean
  startAt: string
  endAt: string
  categoryId?: string
  categorySlug?: string
  slotTime?: string
}

export interface StorefrontFlashDealResponse {
  items: Array<{
    id: string
    name: string
    image: string
    price: number
    originalPrice: number
    discount: number
    stockText: string
    soldPercent: number
    remainingQuantity: number
    soldOut: boolean
    flashDealName: string
    flashDealId: string
    endAt: string
  }>
  serverTime: string
}

export interface FlashDealFormItem {
  productId: string
  productName: string
  variantId?: string | null
  originalPrice: number
  dealPrice: number
  allocatedQuantity: number
  purchaseLimit: number
  sortOrder: number
  discountPercent: number
}