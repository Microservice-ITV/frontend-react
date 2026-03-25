import { combineReducers } from '@reduxjs/toolkit'

import authReducer from '@/features/auth/store/authSlice'
import accountReducer from '@/features/account/store/accountSlice'
import productsReducer from '@/features/products/store/productSlice'
import categoryReducer from '@/features/categories/store/categorySlice'
import cartReducer from '@/features/cart/store/cartSlice'
import checkoutReducer from '@/features/checkout/store/checkoutSlice'
import sellerProductsReducer from '@/features/seller/store/sellerProductsSlice'

// Single source of truth for all state
const rootReducer = combineReducers({
  auth: authReducer,
  account: accountReducer,
  products: productsReducer,
  categories: categoryReducer,
  cart: cartReducer,
  checkout: checkoutReducer,
  sellerProducts: sellerProductsReducer,
})

export default rootReducer