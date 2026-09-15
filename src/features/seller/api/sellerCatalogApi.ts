import { productClient } from '@/lib/api/productClient'
import type {
  CatalogItem,
  CatalogCreatePayload,
  CatalogUpdatePayload,
} from '../types/catalogTypes'

type CatalogApiResponse = {
  success?: boolean
  data?: CatalogItem[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type CatalogDetailApiResponse = {
  success?: boolean
  data?: CatalogItem
}

const makeCatalogApi = (basePath: string) => ({
  list(params: { search?: string; limit?: number } = {}) {
    return productClient.get<CatalogApiResponse>(`/${basePath}`, { params })
  },

  getById(id: string) {
    return productClient.get<CatalogDetailApiResponse>(`/${basePath}/${id}`)
  },

  create(payload: CatalogCreatePayload) {
    return productClient.post<{ success?: boolean; data?: CatalogItem }>(
      `/${basePath}`,
      payload,
    )
  },

  update(id: string, payload: CatalogUpdatePayload) {
    return productClient.patch<{ success?: boolean; data?: CatalogItem }>(
      `/${basePath}/${id}`,
      payload,
    )
  },

  remove(id: string) {
    return productClient.delete<{ success?: boolean; message?: string }>(
      `/${basePath}/${id}`,
    )
  },
})

export const sellerBrandApi = makeCatalogApi('brands')
export const sellerColorApi = makeCatalogApi('colors')
export const sellerSizeApi = makeCatalogApi('sizes')
