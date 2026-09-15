import type { RootState } from '@/app/store'

export const selectAnnouncements = (state: RootState) => state.announcements.items
export const selectSelectedAnnouncement = (state: RootState) => state.announcements.selected
export const selectAnnouncementsLoading = (state: RootState) => state.announcements.loading
export const selectAnnouncementsSubmitting = (state: RootState) => state.announcements.submitting
export const selectAnnouncementsDeleting = (state: RootState) => state.announcements.deleting
export const selectAnnouncementsError = (state: RootState) => state.announcements.error