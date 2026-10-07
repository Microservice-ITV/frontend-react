import axios, { AxiosResponse } from 'axios'
import { productClient } from '@/lib/api/productClient'

export type ShopStatusDto = {
  id: number
  code: string
  label: string
  description?: string | null
}

export type ShopReadItem = {
  id: string
  name: string
  description: string | null
  slug: string
  isActive: boolean
  shopStatusId?: number
  shopStatus?: ShopStatusDto
  userId?: string | null
  userName?: string | null
  sellerContactEmail?: string | null
  sellerContactPhone?: string | null
  cityId?: string | null
  districtId?: string | null
  originAddress?: string | null
  originLat?: number | string | null
  originLng?: number | string | null
  createdAt: string
  updatedAt: string
  _count?: {
    products?: number
  }
}

type ShopsApiResponse = {
  success: boolean
  data: ShopReadItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.error?.message
    if (typeof msg === 'string' && msg.trim()) return msg
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export const adminShopApi = {
  listShops(
    params: { page?: number; limit?: number } = {},
  ): Promise<AxiosResponse<ShopsApiResponse>> {
    return productClient.get('/shops', { params })
  },

  /** Moderation queue: shopStatusId = pending (requires platform admin JWT). */
  listPendingShops(
    params: { page?: number; limit?: number; search?: string } = {},
  ): Promise<AxiosResponse<ShopsApiResponse>> {
    return productClient.get('/shops/pending', { params })
  },

  setShopApproval(
    shopId: string,
    approved: boolean,
  ): Promise<AxiosResponse<{ success?: boolean; data?: ShopReadItem }>> {
    return productClient.patch(`/shops/${shopId}/approval`, { approved })
  },

  getShop(shopId: string): Promise<AxiosResponse<{ success: boolean; data: ShopReadItem }>> {
    return productClient.get(`/shops/${shopId}`)
  },

  updateShop(
    shopId: string,
    body: Record<string, unknown>,
  ): Promise<AxiosResponse<{ success: boolean; data: ShopReadItem }>> {
    return productClient.patch(`/shops/${shopId}`, body)
  },

  deleteShop(shopId: string): Promise<AxiosResponse<{ success: boolean; message?: string }>> {
    return productClient.delete(`/shops/${shopId}`)
  },

  getApiErrorMessage,
}