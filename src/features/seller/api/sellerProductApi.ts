import { ecommerceReadRestClient } from '@/lib/api/ecommerceReadRestClient'
import { AxiosResponse } from 'axios'

export type CatalogProductReadItem = {
  productId: string
  slug: string
  title: string
  description: string
  price: number
  stock: number
  currency: string
  categoryId: string
  shopId?: string
  shop_id?: string
  shop?: {
    id?: string
  }
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

type CatalogProductsApiResponse = {
  items: CatalogProductReadItem[]
  page: number
  limit: number
  total: number
}

export const sellerProductApi = {
  listCatalogProducts(
    params: { page?: number; limit?: number } = {},
  ): Promise<AxiosResponse<CatalogProductsApiResponse>> {
    return ecommerceReadRestClient.get('/catalog/products', { params })
  },
}