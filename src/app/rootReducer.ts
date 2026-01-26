import { combineReducers } from '@reduxjs/toolkit'

import authReducer from '@/features/auth/store/authSlice'
import productsReducer from '@/features/products/store/productSlice'
import categoryReducer from '@/features/categories/store/categorySlice'
import cartReducer from '@/features/cart/store/cartSlice'
import { syncCart } from '@/features/cart/store/cartSlice'

const rootReducer = combineReducers({
  auth: authReducer,
  products: productsReducer,
  categories: categoryReducer,
  cart: cartReducer,
})

export default rootReducer