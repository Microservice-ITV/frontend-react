import type { RootState } from '@/app/store'

export const selectSellerCategories = (state: RootState) => state.sellerCategories.items
export const selectSellerCategoriesStatus = (state: RootState) => state.sellerCategories.status
export const selectSellerCategoriesError = (state: RootState) => state.sellerCategories.error