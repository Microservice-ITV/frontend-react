export const FLASH_DEAL_STATUSES = [
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'PAUSED',
  'ENDED',
  'CANCELLED',
] as const

export type FlashDealStatus = (typeof FLASH_DEAL_STATUSES)[number]

export interface FlashDealApiProduct {
  id: string
  name: string
  slug: string
  price: number | string
  images?: string[]
  stock?: number
  isActive?: boolean
  categoryId?: string | null
  category?: { id: string; name: string; slug: string } | null
  shopName?: string | null
}

export interface FlashDealItem {
  id: string
  flashDealId: string
  productId: string
  variantId: string | null
  originalPrice: number | string
  dealPrice: number | string
  allocatedQuantity: number
  soldQuantity: number
  purchaseLimit: number
  sortOrder: number
  product: FlashDealApiProduct
}

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

export interface FlashDealPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface FlashDealListParams {
  page?: number
  limit?: number
  status?: FlashDealStatus | 'all'
  slotTime?: string
}

export interface FlashDealItemInput {
  productId: string
  variantId?: string | null
  originalPrice: number
  dealPrice: number
  allocatedQuantity: number
  purchaseLimit: number
  sortOrder?: number
}

export interface CreateFlashDealPayload {
  name: string
  description?: string | null
  status?: FlashDealStatus
  slotTime?: string | null
  startAt: string
  endAt: string
  items: FlashDealItemInput[]
}

export interface UpdateFlashDealPayload {
  name?: string
  description?: string | null
  status?: FlashDealStatus
  slotTime?: string | null
  startAt?: string
  endAt?: string
  items?: FlashDealItemInput[]
}

export interface UpdateFlashDealStockItem {
  itemId: string
  allocatedQuantity: number
}

export interface UpdateFlashDealStockPayload {
  items: UpdateFlashDealStockItem[]
}

export type FlashDealLifecycleAction = 'publish' | 'activate' | 'pause' | 'cancel'

export interface ProductCatalogOption {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  isActive: boolean
  categoryId?: string | null
  categoryName?: string | null
  shopName?: string | null
  image?: string | null
}

/**
 * Active flash-deal context carried via router state from a deal card
 * onto the product detail page. The detail page uses `discount` (the
 * deal's percentage off) to derive the promo price for the selected
 * variant, and stamps `flashDealId` on the cart line.
 */
export interface FlashDealPromoContext {
  flashDealId: string
  flashDealItemId?: string | null
  originalPrice: number
  promoPrice: number
  discount: number
  startAt?: string | null
  endAt?: string | null
}