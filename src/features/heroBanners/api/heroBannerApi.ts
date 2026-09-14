import { productClient } from '@/lib/api/productClient'

import type {
  HeroBanner,
  CreateHeroBannerPayload,
  UpdateHeroBannerPayload,
  HeroBannersResponse,
  HeroBannerResponse,
} from '../types/heroBannerTypes'

import type { AxiosResponse } from 'axios'

interface HeroBannersApiResponse {
  success?: boolean
  data?: HeroBanner[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface HeroBannerApiResponse {
  success?: boolean
  data?: HeroBanner
}

export const heroBannerApi = {
  getAll: async (params?: { page?: number; limit?: number; isActive?: boolean }): Promise<HeroBannersResponse> => {
    const response: AxiosResponse<HeroBannersApiResponse> = await productClient.get('/hero-banners', {
      params: { page: 1, limit: 100, ...params },
    })
    return {
      success: response.data.success ?? true,
      data: response.data.data ?? [],
      pagination: response.data.pagination ?? {
        page: 1, limit: 100, total: 0, totalPages: 0,
      },
    }
  },

  getById: async (id: string): Promise<HeroBannerResponse> => {
    const response: AxiosResponse<HeroBannerApiResponse> = await productClient.get(`/hero-banners/${id}`)
    return {
      success: response.data.success ?? true,
      data: response.data.data as HeroBanner,
    }
  },

  create: async (payload: CreateHeroBannerPayload): Promise<HeroBannerResponse> => {
    const formData = new FormData()
    formData.append('image', payload.imageFile)
    if (payload.sortOrder !== undefined) formData.append('sortOrder', String(payload.sortOrder))
    if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive))

    const response: AxiosResponse<HeroBannerApiResponse> = await productClient.post('/hero-banners', formData)
    return {
      success: response.data.success ?? true,
      data: response.data.data as HeroBanner,
    }
  },

  update: async (id: string, payload: UpdateHeroBannerPayload): Promise<HeroBannerResponse> => {
    const formData = new FormData()
    if (payload.sortOrder !== undefined) formData.append('sortOrder', String(payload.sortOrder))
    if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive))
    if (payload.imageFile) formData.append('image', payload.imageFile)

    const response: AxiosResponse<HeroBannerApiResponse> = await productClient.patch(`/hero-banners/${id}`, formData)
    return {
      success: response.data.success ?? true,
      data: response.data.data as HeroBanner,
    }
  },

  delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await productClient.delete<{ success?: boolean; message?: string }>(`/hero-banners/${id}`)
    return {
      success: response.data.success ?? true,
      message: response.data.message,
    }
  },
}
