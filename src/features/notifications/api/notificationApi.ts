import axios from 'axios'
import { setupAuthInterceptors } from '@/lib/api/setupAuthInterceptors'

export type NotificationType =
  | 'ORDER'
  | 'PAYMENT'
  | 'DELIVERY'
  | 'WALLET'
  | 'MARKETING'
  | 'ACCOUNT'

export type NotificationStatus = 'UNREAD' | 'READ'
export type NotificationChannel = 'IN_APP' | 'EMAIL'

export interface NotificationPreference {
  enableEmail: boolean
  enableInApp: boolean
  enablePush: boolean
  enableMarketing: boolean
}

export interface NotificationRow {
  id: string
  userId: string | null
  shopId: string | null
  type: NotificationType
  title: string
  message: string
  data: Record<string, unknown> | null
  status: NotificationStatus
  channels: NotificationChannel[]
  createdAt: string
}

export interface NotificationListResponse {
  success: boolean
  data: NotificationRow[]
}

export interface NotificationUnreadCountResponse {
  success: boolean
  data: {
    count: number
  }
}

export interface NotificationPreferencesResponse {
  success: boolean
  data: NotificationPreference
}

const bffBaseUrl = (import.meta.env.VITE_BFF_SERVICE_URL ?? 'http://localhost:5008').replace(/\/+$/, '')

export const bffClient = axios.create({
  baseURL: bffBaseUrl,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

setupAuthInterceptors(bffClient)

export const notificationApi = {
  list: () => bffClient.get<NotificationListResponse>('/api/v1/notifications'),
  unreadCount: () => bffClient.get<NotificationUnreadCountResponse>('/api/v1/notifications/unread-count'),
  markRead: (id: string) => bffClient.patch(`/api/v1/notifications/${encodeURIComponent(id)}/read`),
  getPreferences: () => bffClient.get<NotificationPreferencesResponse>('/api/v1/notification-preferences'),
  updatePreferences: (preferences: Partial<NotificationPreference>) =>
    bffClient.patch<NotificationPreferencesResponse>('/api/v1/notification-preferences', preferences),
}
