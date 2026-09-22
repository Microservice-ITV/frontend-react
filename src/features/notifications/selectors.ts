import type { RootState } from '@/app/store'

export const selectNotifications = (state: RootState) => state.notifications.items
export const selectUnreadNotificationCount = (state: RootState) => state.notifications.unreadCount
export const selectNotificationLoading = (state: RootState) => state.notifications.loading
export const selectNotificationPreferences = (state: RootState) => state.notifications.preferences
