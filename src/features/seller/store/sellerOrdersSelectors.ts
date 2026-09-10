import type { RootState } from '@/app/store'

export const selectSellerOrders = (state: RootState) => state.sellerOrders.items
export const selectSellerOrdersStatus = (state: RootState) => state.sellerOrders.status
export const selectSellerOrdersError = (state: RootState) => state.sellerOrders.error
