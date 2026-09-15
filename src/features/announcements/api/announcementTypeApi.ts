import { productClient } from '@/lib/api/productClient'

import { DEFAULT_PAGINATION } from '../types/announcementTypes'

import type {
  AnnouncementType,
  AnnouncementTypeElement,
  AnnouncementTypeElementInput,
  AnnouncementTypeElementResponse,
  AnnouncementTypeElementsResponse,
  AnnouncementTypeListResponse,
  AnnouncementTypeResponse,
  CreateAnnouncementTypePayload,
  DeleteResponse,
  UpdateAnnouncementTypeElementPayload,
  UpdateAnnouncementTypePayload,
} from '../types/announcementTypes'

export const announcementTypeApi = {
  getAll: async (): Promise<AnnouncementTypeListResponse> => {
    const response = await productClient.get<AnnouncementTypeListResponse>('/announcement-types', {
      params: { page: 1, limit: 100 },
    })
    return {
      success: response.data.success ?? true,
      data: response.data.data ?? [],
      pagination: response.data.pagination ?? DEFAULT_PAGINATION,
    }
  },

  getById: async (id: string): Promise<AnnouncementTypeResponse> => {
    const response = await productClient.get<AnnouncementTypeResponse>(`/announcement-types/${id}`)
    return {
      success: response.data.success ?? true,
      data: response.data.data as AnnouncementType,
    }
  },

  create: async (payload: CreateAnnouncementTypePayload): Promise<AnnouncementTypeResponse> => {
    const response = await productClient.post<AnnouncementTypeResponse>(
      '/announcement-types',
      payload
    )
    return {
      success: response.data.success ?? true,
      data: response.data.data as AnnouncementType,
    }
  },

  update: async (
    id: string,
    payload: UpdateAnnouncementTypePayload
  ): Promise<AnnouncementTypeResponse> => {
    const response = await productClient.patch<AnnouncementTypeResponse>(
      `/announcement-types/${id}`,
      payload
    )
    return {
      success: response.data.success ?? true,
      data: response.data.data as AnnouncementType,
    }
  },

  delete: async (id: string): Promise<DeleteResponse> => {
    const response = await productClient.delete<DeleteResponse>(`/announcement-types/${id}`)
    return { success: response.data.success ?? true, message: response.data.message }
  },

  createElement: async (
    announcementTypeId: string,
    payload: AnnouncementTypeElementInput
  ): Promise<AnnouncementTypeElementResponse> => {
    const response = await productClient.post<AnnouncementTypeElementResponse>(
      `/announcement-types/${announcementTypeId}/elements`,
      payload
    )
    return {
      success: response.data.success ?? true,
      data: response.data.data as AnnouncementTypeElement,
    }
  },

  updateElement: async (
    announcementTypeId: string,
    elementId: string,
    payload: UpdateAnnouncementTypeElementPayload
  ): Promise<AnnouncementTypeElementResponse> => {
    const response = await productClient.patch<AnnouncementTypeElementResponse>(
      `/announcement-types/${announcementTypeId}/elements/${elementId}`,
      payload
    )
    return {
      success: response.data.success ?? true,
      data: response.data.data as AnnouncementTypeElement,
    }
  },

  deleteElement: async (
    announcementTypeId: string,
    elementId: string
  ): Promise<DeleteResponse> => {
    const response = await productClient.delete<DeleteResponse>(
      `/announcement-types/${announcementTypeId}/elements/${elementId}`
    )
    return { success: response.data.success ?? true, message: response.data.message }
  },

  reorderElements: async (
    announcementTypeId: string,
    elementIds: string[]
  ): Promise<AnnouncementTypeElementsResponse> => {
    const response = await productClient.patch<AnnouncementTypeElementsResponse>(
      `/announcement-types/${announcementTypeId}/elements/order`,
      { elementIds }
    )
    return {
      success: response.data.success ?? true,
      data: response.data.data ?? [],
    }
  },
}