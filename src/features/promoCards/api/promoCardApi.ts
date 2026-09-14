import { productClient } from '@/lib/api/productClient'

import type {
  PromoCard,
  CreatePromoCardPayload,
  UpdatePromoCardPayload,
  PromoCardsResponse,
  PromoCardResponse,
} from '../types/promoCardTypes'

import type { AxiosResponse } from 'axios'

interface PromoCardsApiResponse {
  success?: boolean
  data?: PromoCard[]
}

interface PromoCardApiResponse {
  success?: boolean
  data?: PromoCard
}

export const promoCardApi = {
  getAll: async (): Promise<PromoCardsResponse> => {
    const response: AxiosResponse<PromoCardsApiResponse> = await productClient.get('/promo-banners')
    return {
      success: response.data.success ?? true,
      data: response.data.data ?? [],
    }
  },

  getById: async (id: string): Promise<PromoCardResponse> => {
    const response: AxiosResponse<PromoCardApiResponse> = await productClient.get(`/promo-banners/${id}`)
    return {
      success: response.data.success ?? true,
      data: response.data.data as PromoCard,
    }
  },

  create: async (payload: CreatePromoCardPayload): Promise<PromoCardResponse> => {
    const formData = new FormData()
    formData.append('position', payload.position)
    formData.append('image', payload.imageFile)
    if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive))

    const response: AxiosResponse<PromoCardApiResponse> = await productClient.post('/promo-banners', formData)
    return {
      success: response.data.success ?? true,
      data: response.data.data as PromoCard,
    }
  },

  update: async (id: string, payload: UpdatePromoCardPayload): Promise<PromoCardResponse> => {
    const formData = new FormData()
    if (payload.position !== undefined) formData.append('position', payload.position)
    if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive))
    if (payload.imageFile) formData.append('image', payload.imageFile)

    const response: AxiosResponse<PromoCardApiResponse> = await productClient.patch(`/promo-banners/${id}`, formData)
    return {
      success: response.data.success ?? true,
      data: response.data.data as PromoCard,
    }
  },

  delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await productClient.delete<{ success?: boolean; message?: string }>(`/promo-banners/${id}`)
    return {
      success: response.data.success ?? true,
      message: response.data.message,
    }
  },
}
