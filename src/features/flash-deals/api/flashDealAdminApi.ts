import { productClient } from '@/lib/api/productClient'
import type {
  FlashDeal,
  FlashDealsResponse,
  FlashDealResponse,
  CreateFlashDealPayload,
  UpdateFlashDealPayload,
} from '../types/flashDealTypes'
import type { AxiosResponse } from 'axios'

interface FlashDealsApiResponse {
  success?: boolean
  data?: FlashDeal[]
  pagination?: FlashDealsResponse['pagination']
}

interface FlashDealApiResponse {
  success?: boolean
  data?: FlashDeal
}

export const flashDealAdminApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    status?: string
    slotTime?: string
  }): Promise<FlashDealsResponse> => {
    const response: AxiosResponse<FlashDealsApiResponse> = await productClient.get('/flash-deals', { params })
    return {
      success: response.data.success ?? true,
      data: response.data.data ?? [],
      pagination: response.data.pagination ?? {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    }
  },

  getById: async (id: string): Promise<FlashDealResponse> => {
    const response: AxiosResponse<FlashDealApiResponse> = await productClient.get(`/flash-deals/${id}`)
    return {
      success: response.data.success ?? true,
      data: response.data.data as FlashDeal,
    }
  },

  create: async (payload: CreateFlashDealPayload): Promise<FlashDealResponse> => {
    const response: AxiosResponse<FlashDealApiResponse> = await productClient.post('/flash-deals', payload)
    return {
      success: response.data.success ?? true,
      data: response.data.data as FlashDeal,
    }
  },

  update: async (id: string, payload: UpdateFlashDealPayload): Promise<FlashDealResponse> => {
    const response: AxiosResponse<FlashDealApiResponse> = await productClient.patch(`/flash-deals/${id}`, payload)
    return {
      success: response.data.success ?? true,
      data: response.data.data as FlashDeal,
    }
  },

  delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await productClient.delete<{ success?: boolean; message?: string }>(`/flash-deals/${id}`)
    return {
      success: response.data.success ?? true,
      message: response.data.message,
    }
  },

  publish: async (id: string): Promise<FlashDealResponse> => {
    const response: AxiosResponse<FlashDealApiResponse> = await productClient.post(`/admin/flash-deals/${id}/publish`)
    return {
      success: response.data.success ?? true,
      data: response.data.data as FlashDeal,
    }
  },

  activate: async (id: string): Promise<FlashDealResponse> => {
    const response: AxiosResponse<FlashDealApiResponse> = await productClient.post(`/admin/flash-deals/${id}/activate`)
    return {
      success: response.data.success ?? true,
      data: response.data.data as FlashDeal,
    }
  },

  pause: async (id: string): Promise<FlashDealResponse> => {
    const response: AxiosResponse<FlashDealApiResponse> = await productClient.post(`/admin/flash-deals/${id}/pause`)
    return {
      success: response.data.success ?? true,
      data: response.data.data as FlashDeal,
    }
  },

  cancel: async (id: string): Promise<FlashDealResponse> => {
    const response: AxiosResponse<FlashDealApiResponse> = await productClient.post(`/admin/flash-deals/${id}/cancel`)
    return {
      success: response.data.success ?? true,
      data: response.data.data as FlashDeal,
    }
  },

  updateStock: async (id: string, payload: { items: Array<{ itemId: string; allocatedQuantity: number }> }): Promise<FlashDealResponse> => {
    const response: AxiosResponse<FlashDealApiResponse> = await productClient.patch(`/admin/flash-deals/${id}/stock`, payload)
    return {
      success: response.data.success ?? true,
      data: response.data.data as FlashDeal,
    }
  },
}