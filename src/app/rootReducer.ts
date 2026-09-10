import { combineReducers } from "@reduxjs/toolkit";

import authReducer from '@/features/auth/store/authSlice'
import accountReducer from '@/features/account/store/accountSlice'
import productsReducer from '@/features/products/store/productSlice'
import recommendationsReducer from '@/features/products/store/recommendationsSlice'
import categoryReducer from '@/features/categories/store/categorySlice'
import cartReducer from '@/features/cart/store/cartSlice'
import checkoutReducer from '@/features/checkout/store/checkoutSlice'
import sellerProductsReducer from '@/features/seller/store/sellerProductsSlice'
import sellerCategoriesReducer from '@/features/seller/store/sellerCategoriesSlice'
import sellerOrdersReducer from '@/features/seller/store/sellerOrdersSlice'
import adminShopsReducer from "@/features/admin/store/adminShopsSlice";
import shippingReducer from "@/features/shipping/store/shippingSlice";
import homeFeatureReducer from "@/features/homeFeatures/store/homeFeatureSlice";
import homeQuickActionsReducer from "@/features/home/store/homeSlice";

// Single source of truth for all state
const rootReducer = combineReducers({
  auth: authReducer,
  account: accountReducer,
  products: productsReducer,
  recommendations: recommendationsReducer,
  categories: categoryReducer,
  cart: cartReducer,
  checkout: checkoutReducer,
  shipping: shippingReducer,
  sellerProducts: sellerProductsReducer,
  sellerCategories: sellerCategoriesReducer,
  sellerOrders: sellerOrdersReducer,
  adminShops: adminShopsReducer,
  homeFeatures: homeFeatureReducer,
  homeQuickActions: homeQuickActionsReducer,
});

export default rootReducer;
