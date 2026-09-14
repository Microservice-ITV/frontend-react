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
import adminShopsReducer from '@/features/admin/store/adminShopsSlice'
import adminFlashDealsReducer from '@/features/admin/store/adminFlashDealsSlice'
import shippingReducer from '@/features/shipping/store/shippingSlice'
import flashDealsReducer from '@/features/products/store/flashDealSlice'
import sellerOrdersReducer from '@/features/seller/store/sellerOrdersSlice'
import homeFeatureReducer from "@/features/homeFeatures/store/homeFeatureSlice";
import homeQuickActionsReducer from "@/features/home/store/homeSlice";
import heroBannerReducer from "@/features/heroBanners/store/heroBannerSlice";
import promoCardReducer from "@/features/promoCards/store/promoCardSlice";

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
  adminFlashDeals: adminFlashDealsReducer,
  flashDeals: flashDealsReducer,
})
  homeFeatures: homeFeatureReducer,
  homeQuickActions: homeQuickActionsReducer,
  heroBanners: heroBannerReducer,
  promoCards: promoCardReducer,
});

export default rootReducer;
