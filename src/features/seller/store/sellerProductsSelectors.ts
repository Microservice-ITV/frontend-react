import type { RootState } from '@/app/store'

export const selectSellerProducts = (state: RootState) => state.sellerProducts.items
export const selectSellerProductsStatus = (state: RootState) => state.sellerProducts.status
export const selectSellerProductsError = (state: RootState) => state.sellerProducts.error