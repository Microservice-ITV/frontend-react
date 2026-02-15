import { combineReducers } from '@reduxjs/toolkit'

import authReducer from '@/features/auth/store/authSlice'
import productsReducer from '@/features/products/store/productSlice'
import categoryReducer from '@/features/categories/store/categorySlice'
import cartReducer from '@/features/cart/store/cartSlice'
import checkoutReducer from '@/features/checkout/store/checkoutSlice'

// Single source of truth for all state
const rootReducer = combineReducers({
  auth: authReducer,
  products: productsReducer,
  categories: categoryReducer,
  cart: cartReducer,
  checkout: checkoutReducer,
})

export default rootReducer