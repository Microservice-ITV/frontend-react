export type AdminCampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type AdminSlotStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type AdminItemStatus = 'ACTIVE' | 'SOLD_OUT' | 'ENDED' | 'DISABLED'

// ─────────────────────────────────────────────
// Raw responses from product-service (admin REST)
// ─────────────────────────────────────────────

export interface RawAdminCampaignProduct {
  id: string
  name: string
  images?: string[]
}

export interface RawAdminCampaignItem {
  id: string
  slotId: string
  productId: string
  variantId: string | null
  originalPrice: string | number
  dealPrice: string | number
  allocatedStock: number
  reservedStock: number
  soldStock: number
  maxPerUser: number
  status: AdminItemStatus
  createdAt: string
  updatedAt: string
  product?: RawAdminCampaignProduct
  variant?: unknown
}

export interface RawAdminCampaignSlot {
  id: string
  campaignId: string
  slotTime: string
  status: AdminSlotStatus
  createdAt: string
  updatedAt: string
  items?: RawAdminCampaignItem[]
}

export interface RawAdminCampaign {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  status: AdminCampaignStatus
  createdAt: string
  updatedAt: string
  slots?: RawAdminCampaignSlot[]
}

/** Product option row used inside the item-allocation picker (GET /products). */
export interface AdminProductOption {
  id: string
  name: string
  price: number
  stock: number
  image: string
}

// ─────────────────────────────────────────────
// Normalised rows consumed by the admin UI
// ─────────────────────────────────────────────

export interface AdminFlashDealItem {
  id: string
  slotId: string
  productId: string
  variantId: string | null
  productName: string
  productImage: string
  originalPrice: number
  dealPrice: number
  discountPercent: number
  allocatedStock: number
  soldStock: number
  soldPercent: number
  limitPerUser: number
  status: AdminItemStatus
  createdAt: string
}

export interface AdminFlashDealSlot {
  id: string
  campaignId: string
  slotTime: string
  status: AdminSlotStatus
  items: AdminFlashDealItem[]
}

export interface AdminFlashDealCampaign {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  status: AdminCampaignStatus
  createdAt: string
  slots: AdminFlashDealSlot[]
}

export interface AdminFlashDealsState {
  campaigns: AdminFlashDealCampaign[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

// ─────────────────────────────────────────────
// Mutation request bodies (match backend zod schemas)
// ─────────────────────────────────────────────

export interface AdminCampaignCreateInput {
  title: string
  description?: string
  startTime: string
  endTime: string
}

export interface AdminCampaignUpdateInput {
  title?: string
  description?: string
  startTime?: string
  endTime?: string
}

export interface AdminSlotCreateInput {
  slotTime: string
}

export interface AdminItemAllocationInput {
  productId: string
  variantId?: string
  originalPrice: number
  dealPrice: number
  allocatedStock: number
  maxPerUser?: number
}