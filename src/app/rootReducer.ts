import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "@/features/auth/store/authSlice";
import accountReducer from "@/features/account/store/accountSlice";
import productsReducer from "@/features/products/store/productSlice";
import recommendationsReducer from "@/features/products/store/recommendationsSlice";
import categoryReducer from "@/features/categories/store/categorySlice";
import cartReducer from "@/features/cart/store/cartSlice";
import checkoutReducer from "@/features/checkout/store/checkoutSlice";
import sellerProductsReducer from "@/features/seller/store/sellerProductsSlice";
import sellerCategoriesReducer from "@/features/seller/store/sellerCategoriesSlice";
import sellerOrdersReducer from "@/features/seller/store/sellerOrdersSlice";
import adminShopsReducer from "@/features/admin/store/adminShopsSlice";
import adminDashboardReducer from "@/features/admin/store/adminDashboardSlice";
import adminRbacReducer from "@/features/admin/store/adminRbacSlice";
import adminUsersReducer from "@/features/admin/store/adminUsersSlice";
import adminPricingRulesReducer from "@/features/admin/store/adminPricingRulesSlice";
import adminWeightRatesReducer from "@/features/admin/store/adminWeightRatesSlice";
import adminDistanceRangesReducer from "@/features/admin/store/adminDistanceRangesSlice";
import adminDeliveryQuotesReducer from "@/features/admin/store/adminDeliveryQuotesSlice";
import shippingReducer from "@/features/shipping/store/shippingSlice";
import homeFeatureReducer from "@/features/homeFeatures/store/homeFeatureSlice";
import homeQuickActionsReducer from "@/features/home/store/homeSlice";
import heroBannerReducer from "@/features/heroBanners/store/heroBannerSlice";
import promoCardReducer from "@/features/promoCards/store/promoCardSlice";
import flashDealsReducer from "@/features/flash-deals/store/flashDealSlice";
import announcementTypeReducer from "@/features/announcements/store/announcementTypeSlice";
import announcementReducer from "@/features/announcements/store/announcementSlice";
import aiAssistantReducer from "@/features/ai/store/aiAssistantSlice";
import wishlistReducer from "@/features/wishlist/store/wishlistSlice";
import notificationReducer from "@/features/notifications/store/notificationSlice";
import shopsReducer from "@/features/shops/store/shopSlice";

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
  adminDashboard: adminDashboardReducer,
  adminRbac: adminRbacReducer,
  adminUsers: adminUsersReducer,
  adminPricingRules: adminPricingRulesReducer,
  adminWeightRates: adminWeightRatesReducer,
  adminDistanceRanges: adminDistanceRangesReducer,
  adminDeliveryQuotes: adminDeliveryQuotesReducer,
  // adminFlashDeals: adminFlashDealsReducer,
  // flashDeals: flashDealsReducer,
  homeFeatures: homeFeatureReducer,
  homeQuickActions: homeQuickActionsReducer,
  heroBanners: heroBannerReducer,
  promoCards: promoCardReducer,
  flashDeals: flashDealsReducer,
  announcementTypes: announcementTypeReducer,
  announcements: announcementReducer,
  aiAssistant: aiAssistantReducer,
  wishlist: wishlistReducer,
  notifications: notificationReducer,
  shops: shopsReducer,
});

export default rootReducer;
