import { combineReducers } from '@reduxjs/toolkit'
import authReducer from '@/features/auth/store/authSlice'
import productsReducer from '@/features/products/store/productsSlice'
import categoriesReducer from '@/features/categories/store/categoriesSlice'

const rootReducer = combineReducers({
  auth: authReducer,
  products: productsReducer,
  categories: categoriesReducer,
})

export default rootReducer