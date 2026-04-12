import { combineReducers } from '@reduxjs/toolkit'

import authReducer from '@/features/auth/store/authSlice'
import accountReducer from '@/features/account/store/accountSlice'
import productsReducer from '@/features/products/store/productSlice'
import categoryReducer from '@/features/categories/store/categorySlice'
import cartReducer from '@/features/cart/store/cartSlice'
import checkoutReducer from '@/features/checkout/store/checkoutSlice'
import sellerProductsReducer from '@/features/seller/store/sellerProductsSlice'
import sellerCategoriesReducer from '@/features/seller/store/sellerCategoriesSlice'
import adminShopsReducer from '@/features/admin/store/adminShopsSlice'
import shippingReducer from '@/features/shipping/store/shippingSlice'

// Single source of truth for all state
const rootReducer = combineReducers({
  auth: authReducer,
  account: accountReducer,
  products: productsReducer,
  categories: categoryReducer,
  cart: cartReducer,
  checkout: checkoutReducer,
  shipping: shippingReducer,
  sellerProducts: sellerProductsReducer,
  sellerCategories: sellerCategoriesReducer,
  adminShops: adminShopsReducer,
})

export default rootReducer