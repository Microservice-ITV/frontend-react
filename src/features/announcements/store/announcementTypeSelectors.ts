import type { RootState } from '@/app/store'

export const selectAnnouncementTypes = (state: RootState) => state.announcementTypes.items
export const selectSelectedAnnouncementType = (state: RootState) => state.announcementTypes.selected
export const selectAnnouncementTypesLoading = (state: RootState) => state.announcementTypes.loading
export const selectAnnouncementTypesSubmitting = (state: RootState) =>
  state.announcementTypes.submitting
export const selectAnnouncementTypesDeleting = (state: RootState) => state.announcementTypes.deleting
export const selectAnnouncementTypesError = (state: RootState) => state.announcementTypes.error