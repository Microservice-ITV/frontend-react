import { AxiosResponse } from 'axios'
import { productClient } from '@/lib/api/productClient'

export type ShopReadItem = {
  id: string
  name: string
  description: string
  slug: string
  isActive: boolean
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

export const adminShopApi = {
  listShops(
    params: { page?: number; limit?: number } = {},
  ): Promise<AxiosResponse<ShopsApiResponse>> {
    return productClient.get('/shops', { params })
  },
}