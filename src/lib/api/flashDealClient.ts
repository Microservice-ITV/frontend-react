import { ecommerceReadRestClient } from './ecommerceReadRestClient'

export interface FlashDealTimeSlot {
  time: string
  label: string
  isActive: boolean
  dealCount: number
}

export interface FlashDealApiItem {
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
  productId: string
  productSlug: string
  slot: string
  allocatedQuantity: number
  purchaseLimit: number
  startAt: string
  endAt: string
  categoryId: string
  categorySlug: string
}

export interface FlashDealsTimeSlotResponse {
  items: FlashDealApiItem[]
  timeSlots: FlashDealTimeSlot[]
  serverTime: string
}

export const getFlashDealsByTimeSlot = (params?: {
  limit?: number
  slotTime?: string
  categoryId?: string
  status?: string
}) =>
  ecommerceReadRestClient.get<FlashDealsTimeSlotResponse>(
    '/flash-deals/time-slots',
    { params },
  )