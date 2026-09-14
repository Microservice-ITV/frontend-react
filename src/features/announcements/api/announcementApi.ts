import { productClient } from '@/lib/api/productClient'

import { DEFAULT_PAGINATION } from '../types/announcementTypes'

import type {
  Announcement,
  AnnouncementListResponse,
  AnnouncementResponse,
  CreateAnnouncementPayload,
  DeleteResponse,
  UpdateAnnouncementPayload,
} from '../types/announcementTypes'

export const announcementApi = {
  getAll: async (): Promise<AnnouncementListResponse> => {
    const response = await productClient.get<AnnouncementListResponse>('/announcements', {
      params: { page: 1, limit: 100 },
    })
    return {
      success: response.data.success ?? true,
      data: response.data.data ?? [],
      pagination: response.data.pagination ?? DEFAULT_PAGINATION,
    }
  },

  getById: async (id: string): Promise<AnnouncementResponse> => {
    const response = await productClient.get<AnnouncementResponse>(`/announcements/${id}`)
    return {
      success: response.data.success ?? true,
      data: response.data.data as Announcement,
    }
  },

  create: async (payload: CreateAnnouncementPayload): Promise<AnnouncementResponse> => {
    const response = await productClient.post<AnnouncementResponse>('/announcements', payload)
    return {
      success: response.data.success ?? true,
      data: response.data.data as Announcement,
    }
  },

  update: async (
    id: string,
    payload: UpdateAnnouncementPayload
  ): Promise<AnnouncementResponse> => {
    const response = await productClient.patch<AnnouncementResponse>(`/announcements/${id}`, payload)
    return {
      success: response.data.success ?? true,
      data: response.data.data as Announcement,
    }
  },

  delete: async (id: string): Promise<DeleteResponse> => {
    const response = await productClient.delete<DeleteResponse>(`/announcements/${id}`)
    return { success: response.data.success ?? true, message: response.data.message }
  },
}