import { AxiosResponse } from 'axios'
import { productClient } from '@/lib/api/productClient'

export type CategoryReadItem = {
  id?: string
  _id?: string
  categoryId?: string
  name?: string
  title?: string
  description?: string
  slug?: string
  parentId?: string | null
  parent_id?: string | null
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  image?: string
  imageUrl?: string
}

type CategoriesApiResponse = {
  success?: boolean
  data?: CategoryReadItem[]
  items?: CategoryReadItem[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  page?: number
  limit?: number
  total?: number
}

export const sellerCategoryApi = {
  listCategories(
    params: { page?: number; limit?: number } = {},
  ): Promise<AxiosResponse<CategoriesApiResponse>> {
    return productClient.get('/categories', { params })
  },
}