import type { RootState } from '@/app/store'
import { isShopStockAlert } from '../utils/shopStockWarning'

export const selectSellerProducts = (state: RootState) => state.sellerProducts.items
export const selectSellerProductsStatus = (state: RootState) => state.sellerProducts.status
export const selectSellerProductsError = (state: RootState) => state.sellerProducts.error

export const selectSellerStockAlertCount = (state: RootState) =>
  state.sellerProducts.items.filter(
    (product) => product.status !== 'archived' && isShopStockAlert(product.shopStock),
  ).length