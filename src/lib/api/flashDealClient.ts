import axios from 'axios'
import { ECOMMERCE_READ_SERVICE_BASE_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'

const readClient = axios.create({
  baseURL: ECOMMERCE_READ_SERVICE_BASE_URL,
})

setupAuthInterceptors(readClient)

export type FlashDealTimeSlot = {
  time: string
  label: string
  isActive: boolean
  dealCount: number
}

export type FlashDealTimeSlotItem = {
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
  categoryId: string
  categorySlug: string
}

export type FlashDealsTimeSlotResponse = {
  items: FlashDealTimeSlotItem[]
  timeSlots: FlashDealTimeSlot[]
  serverTime: string
}

export type FlashDealBySlotResponse = {
  items: FlashDealTimeSlotItem[]
  total: number
  serverTime: string
}

export type ActiveFlashDealItem = {
  id: string
  flashDealId: string
  flashDealName: string
  name: string
  image: string
  price: number
  originalPrice: number
  discount: number
  stockText: string
  soldPercent: number
  remainingQuantity: number
  soldOut: boolean
  categoryName: string
  categorySlug: string
  endAt: string
}

export type FlashDealDetailItem = {
  id: string
  productId: string
  variantId: string | null
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
  categoryId: string
  categorySlug: string
}

export type FlashDealDetailResponse = {
  id: string
  name: string
  description: string | null
  status: string
  startAt: string
  endAt: string
  items: FlashDealDetailItem[]
  serverTime: string
}

export const flashDealApi = {
  async getActiveFlashDeals(limit = 10): Promise<{ items: ActiveFlashDealItem[]; serverTime: string }> {
    const response = await readClient.get<{ items: ActiveFlashDealItem[]; serverTime: string }>(
      '/flash-deals/active',
      { params: { limit } }
    )
    return response.data
  },

  async getFlashDealsByTimeSlot(params?: {
    limit?: number
    categoryId?: string
    status?: 'ongoing' | 'upcoming' | 'all'
  }): Promise<FlashDealsTimeSlotResponse> {
    const response = await readClient.get<FlashDealsTimeSlotResponse>(
      '/flash-deals/time-slots',
      { params }
    )
    return response.data
  },

  async getFlashDealsBySlotAndCategory(params?: {
    limit?: number
    slotTime?: string
    categoryId?: string
    status?: 'ongoing' | 'upcoming' | 'all'
  }): Promise<FlashDealBySlotResponse> {
    const response = await readClient.get<FlashDealBySlotResponse>(
      '/flash-deals/by-slot',
      { params }
    )
    return response.data
  },

  async getFlashDealDetail(flashDealId: string): Promise<FlashDealDetailResponse> {
    const response = await readClient.get<FlashDealDetailResponse>(
      `/flash-deals/${flashDealId}`
    )
    return response.data
  },
}