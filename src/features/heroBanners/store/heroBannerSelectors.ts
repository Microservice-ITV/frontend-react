import type { RootState } from '@/app/store'

export const selectHeroBanners = (state: RootState) => state.heroBanners.items
export const selectSelectedHeroBanner = (state: RootState) => state.heroBanners.selected
export const selectHeroBannersLoading = (state: RootState) => state.heroBanners.loading
export const selectHeroBannersSubmitting = (state: RootState) => state.heroBanners.submitting
export const selectHeroBannersDeleting = (state: RootState) => state.heroBanners.deleting
export const selectHeroBannersError = (state: RootState) => state.heroBanners.error
