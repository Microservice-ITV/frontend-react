import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { BuyerHomeRoute, GuestRoute, ProtectedRoute } from "./RouteGuards";
import { ROUTE_ACCESS } from "./routeAccessMap";
import { CATALOG_ENTITY_CONFIG } from "@/features/seller/config/catalogEntityConfig";
import SpinPage from "@/components/spin/SpinPage";
import HomePage from "@/features/home/HomePage";

const HomeFeaturesPage = lazy(() => import("@/features/homeFeatures/pages/HomeFeaturesPage"));
const NewHomeFeaturePage = lazy(() => import("@/features/homeFeatures/pages/NewHomeFeaturePage"));
const EditHomeFeaturePage = lazy(() => import("@/features/homeFeatures/pages/EditHomeFeaturePage"));
const HeroBannersPage = lazy(() => import("@/features/heroBanners/pages/HeroBannersPage"));
const NewHeroBannerPage = lazy(() => import("@/features/heroBanners/pages/NewHeroBannerPage"));
const EditHeroBannerPage = lazy(() => import("@/features/heroBanners/pages/EditHeroBannerPage"));
const PromoCardsPage = lazy(() => import("@/features/promoCards/pages/PromoCardsPage"));
const NewPromoCardPage = lazy(() => import("@/features/promoCards/pages/NewPromoCardPage"));
const EditPromoCardPage = lazy(() => import("@/features/promoCards/pages/EditPromoCardPage"));
const AnnouncementTypesPage = lazy(() => import("@/features/announcements/pages/AnnouncementTypesPage"));
const NewAnnouncementTypePage = lazy(() => import("@/features/announcements/pages/NewAnnouncementTypePage"));
const EditAnnouncementTypePage = lazy(() => import("@/features/announcements/pages/EditAnnouncementTypePage"));
const AnnouncementsPage = lazy(() => import("@/features/announcements/pages/AnnouncementsPage"));
const NewAnnouncementPage = lazy(() => import("@/features/announcements/pages/NewAnnouncementPage"));
const EditAnnouncementPage = lazy(() => import("@/features/announcements/pages/EditAnnouncementPage"));
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@/features/auth/pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const VerifyEmailPage = lazy(() => import("@/features/auth/pages/VerifyEmailPage").then((m) => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import("@/features/auth/pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("@/features/auth/pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })));
const OAuthSuccessPage = lazy(() => import("@/features/auth/pages/OAuthSuccessPage"));
const OAuthErrorPage = lazy(() => import("@/features/auth/pages/OAuthErrorPage"));
const ForbiddenPage = lazy(() => import("@/features/auth/pages/ForbiddenPage"));
const RecentlyAddedPage = lazy(() => import("@/features/home/pages/RecentlyAddedPage"));
const ProductListPage = lazy(() => import("@/features/products/pages/ProductListPage"));
const ProductDetailPage = lazy(() => import("@/features/products/pages/ProductDetailPage"));
const SearchPage = lazy(() => import("@/features/search/pages/SearchPage"));
const CartPage = lazy(() => import("@/features/cart/pages/CartPage"));
const CartSeeMorePage = lazy(() => import("@/features/cart/pages/CartSeeMorePage"));
const WishlistPage = lazy(() => import("@/features/wishlist/pages/WishlistPage"));
const CheckoutSuccessPage = lazy(() => import("@/features/checkout/pages/CheckoutSuccessPage"));
const CheckoutGatePage = lazy(() => import("@/features/checkout/pages/CheckoutGatePage"));
const GuestCheckoutPage = lazy(() => import("@/features/checkout/pages/GuestCheckoutPage.tsx"));
const StaffCheckoutDetailsPage = lazy(() => import("@/features/checkout/pages/StaffCheckoutDetailsPage"));
const GuestCheckoutSuccessPage = lazy(() => import("@/features/checkout/pages/GuestCheckoutSuccessPage"));
const CategoriesPage = lazy(() => import("@/features/categories/pages/CategoriesPage"));
const AboutUsPage = lazy(() => import("@/features/about/pages/AboutUsPage"));
const CareersPage = lazy(() => import("@/features/careers/pages/CareersPage"));
const AdminRbacPage = lazy(() => import("@/features/admin/pages/AdminRbacPage"));
const PoliciesPage = lazy(() => import("@/features/policies/pages/PoliciesPage"));
const PrivacyPolicyPage = lazy(() => import("@/features/privacy/pages/PrivacyPolicyPage"));
const BlogPage = lazy(() => import("@/features/blog/pages/BlogPage"));
const MallPage = lazy(() => import("@/features/mall/pages/MallPage"));
const ShopPage = lazy(() => import("@/features/shops/pages/ShopPage"));
const SellerCentrePage = lazy(() => import("@/features/seller-centre/pages/SellerCentrePage"));
const SellerMentorsPage = lazy(() => import("@/features/seller-mentors/pages/SellerMentorsPage"));
const FlashDealsPage = lazy(() => import("@/features/flash-deals/pages/FlashDealsPage"));
const MediaContactPage = lazy(() => import("@/features/media/pages/MediaContactPage"));
const AmbassadorProgrammePage = lazy(() => import("@/features/ambassador/pages/AmbassadorProgrammePage"));
const NotFoundPage = lazy(() => import("@/features/common/pages/NotFoundPage"));
const AccountLayout = lazy(() => import("@/features/account/pages/AccountLayout"));
const ProfilePage = lazy(() => import("@/features/account/pages/ProfilePage"));
const BanksCardsPage = lazy(() => import("@/features/account/pages/BanksCardsPage"));
const AddressesPage = lazy(() => import("@/features/account/pages/AddressesPage"));
const PrivacyPage = lazy(() => import("@/features/account/pages/PrivacyPage"));
const ChangePasswordPage = lazy(() => import("@/features/account/pages/ChangePasswordPage"));
const NotificationsPage = lazy(() => import("@/features/account/pages/NotificationsPage"));
const NotificationsCenterPage = lazy(() => import("@/features/account/pages/NotificationsCenterPage"));
const OrdersPage = lazy(() => import("@/features/account/pages/OrdersPage"));
const QuantityApprovalsPage = lazy(() => import("@/features/account/pages/QuantityApprovalsPage"));
const QuantityApprovalDetailPage = lazy(() => import("@/features/account/pages/QuantityApprovalDetailPage"));
const OrderTrackingPage = lazy(() => import("@/features/account/pages/OrderTrackingPage"));
const StaffShopOrdersPage = lazy(() => import("@/features/account/pages/StaffShopOrdersPage"));
const CustomerInvoicesPage = lazy(() => import("@/features/account/pages/CustomerInvoicesPage"));
const CustomerInvoiceDetailPage = lazy(() => import("@/features/account/pages/CustomerInvoiceDetailPage"));
const CustomerInvoicePrintPage = lazy(() => import("@/features/account/pages/CustomerInvoicePrintPage"));
const CustomerReceiptPrintPage = lazy(() => import("@/features/account/pages/CustomerReceiptPrintPage"));
const ScopedInvoiceDetailPage = lazy(() => import("@/features/invoices/pages/ScopedInvoiceDetailPage"));
const VouchersPage = lazy(() => import("@/features/account/pages/VouchersPage"));
const CoinsPage = lazy(() => import("@/features/account/pages/CoinsPage"));
const DashboardLayout = lazy(() => import("@/features/dashboard/components/layout/DashboardLayout"));
const DashboardPlaceholderPage = lazy(() => import("@/features/dashboard/components/layout/DashboardPlaceholderPage"));
const WarehouseOverviewPage = lazy(() => import("@/features/warehouse/pages/WarehouseOverviewPage"));
const WarehousesPage = lazy(() => import("@/features/warehouse/pages/WarehousesPage"));
const WarehouseDetailPage = lazy(() => import("@/features/warehouse/pages/WarehouseDetailPage"));
const WarehouseFormPage = lazy(() => import("@/features/warehouse/pages/WarehouseFormPage"));
const InventoryPage = lazy(() => import("@/features/warehouse/pages/InventoryPage"));
const InventoryEditPage = lazy(() => import("@/features/warehouse/pages/InventoryEditPage"));
const MovementsPage = lazy(() => import("@/features/warehouse/pages/MovementsPage"));
const AssignWarehouseManagerPage = lazy(() => import("@/features/warehouse/pages/AssignWarehouseManagerPage"));
const AssignDeliveryAgentPage = lazy(() => import("@/features/warehouse/pages/AssignDeliveryAgentPage"));
const StockOperationPage = lazy(() => import("@/features/warehouse/pages/StockOperationPage"));
const SuppliersPage = lazy(() => import("@/features/purchase/pages/SuppliersPage"));
const SupplierDetailPage = lazy(() => import("@/features/purchase/pages/SupplierDetailPage"));
const SupplierFormPage = lazy(() => import("@/features/purchase/pages/SupplierFormPage"));
const PurchaseOrdersPage = lazy(() => import("@/features/purchase/pages/PurchaseOrdersPage"));
const CreatePurchaseOrderPage = lazy(() => import("@/features/purchase/pages/CreatePurchaseOrderPage"));
const PurchaseReturnsPage = lazy(() => import("@/features/purchase/pages/PurchaseReturnsPage"));
const PurchaseReceiptsPage = lazy(() => import("@/features/purchase/pages/PurchaseReceiptsPage"));
const PurchaseOrderTrackingPage = lazy(() => import("@/features/purchase/pages/PurchaseOrderTrackingPage"));
const WarehouseOrderPage = lazy(() => import("@/features/purchase/pages/WarehouseOrderPage"));
const SellerWarehouseRequestsPage = lazy(() => import("@/features/purchase/pages/SellerWarehouseRequestsPage"));
const SellerWarehouseOrdersPage = lazy(() => import("@/features/purchase/pages/SellerWarehouseOrdersPage"));
const DeliveryParcelsPage = lazy(() => import("@/features/purchase/pages/DeliveryParcelsPage"));
const DamageReportsPage = lazy(() => import("@/features/purchase/pages/DamageReportsPage"));
const DeliveryOverviewPage = lazy(() => import("@/features/purchase/pages/DeliveryOverviewPage"));
const SellerOverviewPage = lazy(() => import("@/features/seller/pages/SellerOverviewPage"));
const SellerOrdersPage = lazy(() => import("@/features/seller/pages/SellerOrdersPage"));
const SellerQuantityApprovalsPage = lazy(() => import("@/features/seller/pages/SellerQuantityApprovalsPage"));
const SellerQuantityApprovalDetailPage = lazy(() => import("@/features/seller/pages/SellerQuantityApprovalDetailPage"));
const SellerOrderDetailPage = lazy(() => import("@/features/seller/pages/SellerOrderDetailPage"));
const SellerProductsPage = lazy(() => import("@/features/seller/pages/SellerProductsPage"));
const SellerUsersPage = lazy(() => import("@/features/seller/pages/SellerUsersPage"));
const SellerCategoriesPage = lazy(() => import("@/features/seller/pages/SellerCategoriesPage"));
const NewProductPage = lazy(() => import("@/features/seller/pages/NewProductPage"));
const EditProductPage = lazy(() => import("@/features/seller/pages/EditProductPage"));
const SellerProductDetailPage = lazy(() => import("@/features/seller/pages/SellerProductDetailPage"));
const NewCategoryPage = lazy(() => import("@/features/seller/pages/NewCategoryPage"));
const EditCategoryPage = lazy(() => import("@/features/seller/pages/EditCategoryPage"));
const SellerCategoryDetailPage = lazy(() => import("@/features/seller/pages/SellerCategoryDetailPage"));
const CatalogListPage = lazy(() => import("@/features/seller/pages/CatalogListPage"));
const CatalogFormPage = lazy(() => import("@/features/seller/pages/CatalogFormPage"));
const SellerNotificationsPage = lazy(() => import("@/features/seller/pages/SellerNotificationsPage"));
const SellerInvoicesPage = lazy(() => import("@/features/seller/pages/SellerInvoicesPage"));
const PaymentsPage = lazy(() => import("@/features/seller/pages/PaymentsPage"));
const PaymentDetailPage = lazy(() => import("@/features/seller/pages/PaymentDetailPage"));
const SellerChatPage = lazy(() => import("@/features/seller/pages/SellerChatPage"));
const SellerHelpSupportPage = lazy(() => import("@/features/seller/pages/SellerHelpSupportPage"));
const SellerRegisterPage = lazy(() => import("@/features/seller/pages/SellerRegisterPage"));
const AdminOverviewPage = lazy(() => import("@/features/admin/pages/AdminOverviewPage"));
const AdminShopDetailPage = lazy(() => import("@/features/admin/pages/AdminShopDetailPage"));
const AdminShopEditPage = lazy(() => import("@/features/admin/pages/AdminShopEditPage"));
const AdminShopsPage = lazy(() => import("@/features/admin/pages/AdminShopsPage"));
const AdminPricingRulesPage = lazy(() => import("@/features/admin/pages/AdminPricingRulesPage"));
const AdminTaxPage = lazy(() => import("@/features/admin/pages/AdminTaxPage"));
const AdminTaxFormPage = lazy(() => import("@/features/admin/pages/AdminTaxFormPage"));
const AdminPricingRuleFormPage = lazy(() => import("@/features/admin/pages/AdminPricingRuleFormPage"));
const AdminPricingRuleDetailPage = lazy(() => import("@/features/admin/pages/AdminPricingRuleDetailPage"));
const AdminWeightRatesPage = lazy(() => import("@/features/admin/pages/AdminWeightRatesPage"));
const AdminWeightRateFormPage = lazy(() => import("@/features/admin/pages/AdminWeightRateFormPage"));
const AdminWeightRateDetailPage = lazy(() => import("@/features/admin/pages/AdminWeightRateDetailPage"));
const AdminCityRatesPage = lazy(() => import("@/features/admin/pages/AdminCityRatesPage"));
const AdminDeliveryCompaniesPage = lazy(() => import("@/features/admin/pages/AdminDeliveryCompaniesPage"));
const AdminDeliveryCompanyFormPage = lazy(() => import("@/features/admin/pages/AdminDeliveryCompanyFormPage"));
const AdminCityRateFormPage = lazy(() => import("@/features/admin/pages/AdminCityRateFormPage"));
const AdminDistanceRangeFormPage = lazy(() => import("@/features/admin/pages/AdminDistanceRangeFormPage"));
const AdminDistanceRangeDetailPage = lazy(() => import("@/features/admin/pages/AdminDistanceRangeDetailPage"));
const AdminDeliveryQuotesPage = lazy(() => import("@/features/admin/pages/AdminDeliveryQuotesPage"));
const AdminDeliveryQuoteDetailPage = lazy(() => import("@/features/admin/pages/AdminDeliveryQuoteDetailPage"));
const AdminUsersPage = lazy(() => import("@/features/admin/pages/AdminUsersPage"));
const PlatformUsersPage = lazy(() => import("@/features/admin/pages/PlatformUsersPage"));
const AdminInvoicesPage = lazy(() => import("@/features/admin/pages/AdminInvoicesPage"));
const AdminMissingInvoicesPage = lazy(() => import("@/features/admin/pages/AdminMissingInvoicesPage"));
const AdminIncomePage = lazy(() => import("@/features/admin/pages/AdminIncomePage"));
const AdminExpensePage = lazy(() => import("@/features/admin/pages/AdminExpensePage"));
const AdminExpenseCategoriesPage = lazy(() => import("@/features/admin/pages/AdminExpenseCategoriesPage"));
const SellerDeliveryCompanyFeesPage = lazy(() => import("@/features/seller/pages/SellerDeliveryCompanyFeesPage"));
const CommonNotificationsPage = lazy(() => import("@/features/common/pages/CommonNotificationsPage"));
const CommonChatPage = lazy(() => import("@/features/common/pages/CommonChatPage"));
const CommonHelpSupportPage = lazy(() => import("@/features/common/pages/CommonHelpSupportPage"));
const CommonSettingsPage = lazy(() => import("@/features/common/pages/CommonSettingsPage"));
const HelpCenterPage = lazy(() => import("@/features/help-center/components/HelpCenterPage"));
const HelpArticlePage = lazy(() => import("@/features/help-center/components/HelpArticlePage"));
const AnnouncementDetailPage = lazy(() => import("@/features/announcements/pages/AnnouncementDetailPage"));
const PhoneAuthPage = lazy(() => import("@/features/auth/pages/PhoneAuthPage").then((m) => ({ default: m.PhoneAuthPage })));
const PhoneOtpPage = lazy(() => import("@/features/auth/pages/PhoneOtpPage").then((m) => ({ default: m.PhoneOtpPage })));
const PromotionEnginePage = lazy(() => import("@/features/promotions/pages/PromotionEnginePage"));
const AdminFlashDealsPage = lazy(() => import("@/features/flash-deals/pages/AdminFlashDealsPage"));
const NewFlashDealPage = lazy(() => import("@/features/flash-deals/pages/NewFlashDealPage"));
const EditFlashDealPage = lazy(() => import("@/features/flash-deals/pages/EditFlashDealPage"));
const AdminBundlesPage = lazy(() => import("@/features/bundles/pages/AdminBundlesPage"));
const BundleFormPage = lazy(() => import("@/features/bundles/pages/BundleFormPage"));
const SellerFinanceOverviewPage = lazy(() => import("@/features/finance/pages/SellerFinanceOverviewPage"));
const SellerFinanceTransactionsPage = lazy(() => import("@/features/finance/pages/SellerFinanceTransactionsPage"));
const SellerAccountingOverviewPage = lazy(() => import("@/features/accounting/pages/SellerAccountingOverviewPage"));
const SellerProfitLossPage = lazy(() => import("@/features/accounting/pages/SellerProfitLossPage"));
const SellerExpenseFormPage = lazy(() => import("@/features/accounting/pages/SellerExpenseFormPage"));
const SellerExpensesPage = lazy(() => import("@/features/accounting/pages/SellerExpensesPage"));
const SellerPendingApprovalsPage = lazy(() => import("@/features/accounting/pages/SellerPendingApprovalsPage"));
const SellerExpenseDetailPage = lazy(() => import("@/features/accounting/pages/SellerExpenseDetailPage"));
const SellerIncomePage = lazy(() => import("@/features/accounting/pages/SellerIncomePage"));
const SellerJournalEntriesPage = lazy(() => import("@/features/accounting/pages/SellerJournalEntriesPage"));
const SellerApprovalPoliciesPage = lazy(() => import("@/features/accounting/pages/SellerApprovalPoliciesPage"));
const SellerApprovalPolicyFormPage = lazy(() => import("@/features/accounting/pages/SellerApprovalPolicyFormPage"));
const AdminFinanceOverviewPage = lazy(() => import("@/features/finance/pages/AdminFinanceOverviewPage"));
const AdminFinanceTransactionsPage = lazy(() => import("@/features/finance/pages/AdminFinanceTransactionsPage"));
const AdminAccountingOverviewPage = lazy(() => import("@/features/accounting/pages/AdminAccountingOverviewPage"));
const AdminChartOfAccountsPage = lazy(() => import("@/features/accounting/pages/AdminChartOfAccountsPage"));
const AdminJournalEntriesPage = lazy(() => import("@/features/accounting/pages/AdminJournalEntriesPage"));
const PlatformExpensesPage = lazy(() => import("@/features/admin/pages/PlatformExpensesPage"));
const PlatformApprovalPoliciesPage = lazy(() => import("@/features/admin/pages/PlatformApprovalPoliciesPage"));
const PlatformPendingApprovalsPage = lazy(() => import("@/features/admin/pages/PlatformPendingApprovalsPage"));


const AppRoutes = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] w-full items-center justify-center">
          <SpinPage />
        </div>
      }
    >
      <Routes>
      {/* Guest-only routes */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/phone-auth" element={<PhoneAuthPage />} />
        <Route path="/phone-verify" element={<PhoneOtpPage />} />
        <Route path="/checkout/guest" element={<GuestCheckoutPage />} />
        {/* Backward-compatibility: old guest payment url */}
        <Route path="/checkout/guest/checkout" element={<Navigate to="/checkout" replace />} />
        <Route path="/checkout/guest/success" element={<GuestCheckoutSuccessPage />} />
      </Route>

      {/* Unified checkout (guest + logged-in) */}
      <Route path="/checkout" element={<CheckoutGatePage />} />
      <Route
        path="/checkout/customer"
        element={
          <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.checkout}>
            <StaffCheckoutDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account/invoices/:invoiceNumber/print"
        element={<CustomerInvoicePrintPage />}
      />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/account"
          element={
            <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.accountRoot} />
          }
        >
          <Route element={<AccountLayout />}>
            <Route index element={<ProfilePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="banks-cards" element={<BanksCardsPage />} />
            <Route
              path="addresses"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.accountAddresses}
                >
                  <AddressesPage />
                </ProtectedRoute>
              }
            />
            <Route path="change-password" element={<ChangePasswordPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route
              path="notifications-center"
              element={<NotificationsCenterPage />}
            />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route
              path="orders"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.accountOrders}
                >
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="quantity-approvals"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.accountOrders}
                >
                  <QuantityApprovalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="quantity-approvals/:checkoutId"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.accountOrders}
                >
                  <QuantityApprovalDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/:orderId"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.accountOrders}
                >
                  <OrderTrackingPage />
                </ProtectedRoute>
              }
            />
            <Route path="shop-orders" element={<StaffShopOrdersPage />} />
            <Route path="invoices" element={<CustomerInvoicesPage />} />
            <Route path="invoices/:invoiceNumber" element={<CustomerInvoiceDetailPage />} />
            <Route path="my-vouchers" element={<VouchersPage />} />
            <Route path="my-coins" element={<CoinsPage />} />
          </Route>
        </Route>
        <Route
          path="/checkout/success"
          element={
            <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.checkoutSuccess}>
              <CheckoutSuccessPage />
            </ProtectedRoute>
          }
        />
        {/* /checkout is now handled by CheckoutGatePage above */}
        <Route
          path="/become-a-seller"
          element={
            <ProtectedRoute>
              <SellerRegisterPage />
            </ProtectedRoute>
          }
        />
        <Route path="/seller" element={<DashboardLayout area="seller" />}>
          <Route
            element={
              <ProtectedRoute
                requiredCapabilities={ROUTE_ACCESS.sellerDashboard}
                allowedRoles={["SHOP_OWNER", "SHOP_ADMIN"]}
              />
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route
              path="overview"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerOverview}
                >
                  <SellerOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouse}>
                  <WarehouseOverviewPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/warehouses"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouse}>
                  <WarehousesPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/warehouses/new"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouse}>
                  <WarehouseFormPage base="/seller" mode="create" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/warehouses/:id/edit"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouse}>
                  <WarehouseFormPage base="/seller" mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/warehouses/:id"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouse}>
                  <WarehouseDetailPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/inventory"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouse}>
                  <InventoryPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/inventory/edit"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouse}>
                  <InventoryEditPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/movements"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouse}>
                  <MovementsPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/transfer"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouse}>
                  <StockOperationPage base="/seller" kind="transfer" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/purchase-orders"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.purchase}>
                  <PurchaseOrdersPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/purchase-orders/new"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.purchase}>
                  <CreatePurchaseOrderPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/orders/new"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.purchase}>
                  <WarehouseOrderPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/from-warehouse"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.purchase}>
                  <SellerWarehouseOrdersPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/purchase-order-tracking"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.purchase}>
                  <PurchaseOrderTrackingPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/parcels"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.purchase}>
                  <DeliveryParcelsPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/receipts"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.purchase}>
                  <PurchaseReceiptsPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/returns"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.purchase}>
                  <PurchaseReturnsPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/damage-reports"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.purchase}>
                  <DamageReportsPage base="/seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="analytics"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerAnalytics}
                >
                  <DashboardPlaceholderPage
                    title="Seller Analytics"
                    description="Analytics widgets for traffic, conversion rate, and sales trends will live here."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="quantity-approvals/:checkoutId"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerOrders}>
                  <SellerQuantityApprovalDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="quantity-approvals"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerOrders}>
                  <SellerQuantityApprovalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/cancelled"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerOrders}>
                  <SellerOrdersPage fixedFilter="cancelled" />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/returns"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerOrders}>
                  <SellerOrdersPage fixedFilter="returned" />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerOrders}
                >
                  <SellerOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/:id"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerOrders}
                >
                  <SellerOrderDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerOrders}>
                  <PaymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments/:paymentId"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerOrders}>
                  <PaymentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="categories/new"
              element={<Navigate to="/seller/categories" replace />}
            />
            <Route
              path="categories/:id/edit"
              element={<Navigate to="/seller/categories" replace />}
            />
            <Route
              path="categories/:id"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerCategoriesView}
                >
                  <SellerCategoryDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="categories"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerCategoriesView}
                >
                  <SellerCategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="brands/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerCatalogRefs}
                >
                  <CatalogFormPage
                    config={CATALOG_ENTITY_CONFIG.brand}
                    mode="create"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="brands/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerCatalogRefs}
                >
                  <CatalogFormPage
                    config={CATALOG_ENTITY_CONFIG.brand}
                    mode="edit"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="brands"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerCatalogRefs}
                >
                  <CatalogListPage config={CATALOG_ENTITY_CONFIG.brand} />
                </ProtectedRoute>
              }
            />
            <Route
              path="colors/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerCatalogRefs}
                >
                  <CatalogFormPage
                    config={CATALOG_ENTITY_CONFIG.color}
                    mode="create"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="colors/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerCatalogRefs}
                >
                  <CatalogFormPage
                    config={CATALOG_ENTITY_CONFIG.color}
                    mode="edit"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="colors"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerCatalogRefs}
                >
                  <CatalogListPage config={CATALOG_ENTITY_CONFIG.color} />
                </ProtectedRoute>
              }
            />
            <Route
              path="sizes/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerCatalogRefs}
                >
                  <CatalogFormPage
                    config={CATALOG_ENTITY_CONFIG.size}
                    mode="create"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="sizes/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerCatalogRefs}
                >
                  <CatalogFormPage
                    config={CATALOG_ENTITY_CONFIG.size}
                    mode="edit"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="sizes"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerCatalogRefs}
                >
                  <CatalogListPage config={CATALOG_ENTITY_CONFIG.size} />
                </ProtectedRoute>
              }
            />
            <Route
              path="products/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerProducts}
                >
                  <NewProductPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="products/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerProducts}
                >
                  <EditProductPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="products/:id"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerProducts}
                >
                  <SellerProductDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="products"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerProducts}
                >
                  <SellerProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotions"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.promotionsView}
                  allowedRoles={["SHOP_OWNER", "SHOP_ADMIN"]}
                >
                  <PromotionEnginePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotion-engine/flash-deals"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerFlashDealsView}
                >
                  <AdminFlashDealsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotion-engine/flash-deals/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerFlashDealsNew}
                >
                  <NewFlashDealPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotion-engine/flash-deals/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerFlashDealsEdit}
                >
                  <EditFlashDealPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotion-engine/bundles"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerBundlesView}>
                  <AdminBundlesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotion-engine/bundles/new"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerBundlesView}>
                  <BundleFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotion-engine/bundles/:id/edit"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerBundlesView}>
                  <BundleFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerOverview}
                  allowedRoles={["SHOP_OWNER", "SHOP_ADMIN"]}
                >
                  <SellerUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="invoices"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerInvoices}
                >
                  <SellerInvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="invoices/:invoiceNumber"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerInvoices}
                >
                  <ScopedInvoiceDetailPage backTo="/seller/invoices" backLabel="Back to invoices" />
                </ProtectedRoute>
              }
            />
            <Route
              path="finance"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerFinanceOverview}
                >
                  <SellerFinanceOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="finance/transactions"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerFinanceTransactions}
                >
                  <SellerFinanceTransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting"
              element={<Navigate to="/seller/accounting/overview" replace />}
            />
            <Route
              path="accounting/overview"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerAccounting}
                >
                  <SellerAccountingOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/delivery-company-fees"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerAccounting}>
                  <SellerDeliveryCompanyFeesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/profit-loss"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerAccounting}
                >
                  <SellerProfitLossPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/income"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerAccounting}
                >
                  <SellerIncomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/expenses"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerAccounting}
                >
                  <SellerExpensesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/pending-approvals"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerPendingApprovals}
                >
                  <SellerPendingApprovalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/expenses/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerAccounting}
                >
                  <SellerExpenseFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/expenses/:expenseId"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerAccounting}
                >
                  <SellerExpenseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/journal-entries"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerAccounting}
                >
                  <SellerJournalEntriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/chart-of-accounts"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerAccounting}
                >
                  <AdminChartOfAccountsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/approval-policies"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerAccounting}>
                  <SellerApprovalPoliciesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/approval-policies/new"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerAccounting}>
                  <SellerApprovalPolicyFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/approval-policies/:policyId"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerAccounting}>
                  <SellerApprovalPolicyFormPage readOnly />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/approval-policies/:policyId/edit"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerAccounting}>
                  <SellerApprovalPolicyFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="mail"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerMail}>
                  <DashboardPlaceholderPage
                    title="Mail"
                    description="Email inbox and messaging will be implemented here."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="chat"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerChat}>
                  <SellerChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="files"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerFiles}>
                  <DashboardPlaceholderPage
                    title="Files"
                    description="File storage and document management will be implemented here."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerNotifications}
                >
                  <SellerNotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerSettings}
                >
                  <CommonSettingsPage area="seller" />
                </ProtectedRoute>
              }
            />
            <Route
              path="help-support"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.sellerHelpSupport}
                >
                  <SellerHelpSupportPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>
        <Route path="/delivery-agent" element={<DashboardLayout area="delivery_agent" />}>
          <Route
            element={
              <ProtectedRoute
                requiredCapabilities={ROUTE_ACCESS.deliveryAgent}
                allowedRoles={["DELIVERY_AGENT"]}
              />
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route
              path="overview"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.deliveryAgent}>
                  <DeliveryOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="parcels"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.deliveryAgentParcels}>
                  <DeliveryParcelsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="damage-reports"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.deliveryAgentDamageReports}>
                  <DamageReportsPage base="/delivery-agent" />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>
        <Route path="/warehouse-manager" element={<DashboardLayout area="warehouse_manager" />}>
          <Route
            element={
              <ProtectedRoute
                requiredCapabilities={ROUTE_ACCESS.warehouseManager}
                allowedRoles={["WAREHOUSE_MANAGER"]}
              />
            }
          >
            <Route index element={<Navigate to="warehouse" replace />} />
            <Route
              path="warehouse"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <WarehouseOverviewPage base="/warehouse-manager" platform />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/warehouses"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <WarehousesPage base="/warehouse-manager" platform />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/warehouses/new"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <WarehouseFormPage base="/warehouse-manager" mode="create" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/warehouses/:id/edit"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <WarehouseFormPage base="/warehouse-manager" mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/warehouses/:id"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <WarehouseDetailPage base="/warehouse-manager" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/inventory"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <InventoryPage base="/warehouse-manager" platform />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/transfer"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <StockOperationPage base="/warehouse-manager" kind="transfer" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/movements"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <MovementsPage base="/warehouse-manager" platform />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/suppliers"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <SuppliersPage base="/warehouse-manager" platform />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/suppliers/new"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <SupplierFormPage base="/warehouse-manager" mode="create" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/suppliers/:id/edit"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <SupplierFormPage base="/warehouse-manager" mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/suppliers/:id"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <SupplierDetailPage base="/warehouse-manager" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/purchase-orders"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <PurchaseOrdersPage base="/warehouse-manager" platform />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/seller-requests"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <SellerWarehouseRequestsPage base="/warehouse-manager" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/receipts"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <PurchaseReceiptsPage base="/warehouse-manager" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/returns"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseManager}>
                  <PurchaseReturnsPage base="/warehouse-manager" platform />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>
        <Route path="/super-admin" element={<DashboardLayout area="super_admin" />}>
          <Route
            element={
              <ProtectedRoute
                requiredCapabilities={ROUTE_ACCESS.superAdminDashboard}
                allowedRoles={["SUPER_ADMIN"]}
              />
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route
              path="overview"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <AdminOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminWarehouse}
                >
                  <WarehouseOverviewPage base="/super-admin" platform />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/warehouses"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminWarehouse}
                >
                  <WarehousesPage base="/super-admin" platform />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/warehouses/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminWarehouse}
                >
                  <WarehouseFormPage base="/super-admin" mode="create" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/warehouses/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminWarehouse}
                >
                  <WarehouseFormPage base="/super-admin" mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/warehouses/:id"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminWarehouse}
                >
                  <WarehouseDetailPage base="/super-admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/inventory"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminWarehouse}
                >
                  <InventoryPage base="/super-admin" platform />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/movements"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminWarehouse}
                >
                  <MovementsPage base="/super-admin" platform />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/suppliers"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminPurchase}>
                  <SuppliersPage base="/super-admin" platform />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/suppliers/new"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminPurchase}>
                  <SupplierFormPage base="/super-admin" mode="create" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/suppliers/:id/edit"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminPurchase}>
                  <SupplierFormPage base="/super-admin" mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/suppliers/:id"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminPurchase}>
                  <SupplierDetailPage base="/super-admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/assign-manager"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminWarehouse}>
                  <AssignWarehouseManagerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="warehouse/assign-delivery-agent"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminWarehouse}>
                  <AssignDeliveryAgentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="analytics"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <DashboardPlaceholderPage
                    title="Platform Analytics"
                    description="Cross-shop analytics, usage trends, and performance metrics will be implemented here."
                  />
                </ProtectedRoute>
              }
            />
            {/*
            <Route
              path="orders"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOrders}
                >
                  <AdminOrderApprovalsPage />
                </ProtectedRoute>
              }
            />
            */}
            <Route
              path="shops"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShops}
                >
                  <AdminShopsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminOverview}>
                  <PaymentsPage admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments/:paymentId"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminOverview}>
                  <PaymentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="home-features/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <NewHomeFeaturePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="home-features/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <EditHomeFeaturePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="home-features"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <HomeFeaturesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="hero-banners/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <NewHeroBannerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="hero-banners/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <EditHeroBannerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="hero-banners"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <HeroBannersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promo-banners/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <NewPromoCardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promo-banners/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <EditPromoCardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promo-banners"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <PromoCardsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="announcement-types/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <NewAnnouncementTypePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="announcement-types/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <EditAnnouncementTypePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="announcement-types"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <AnnouncementTypesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="announcements/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <NewAnnouncementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="announcements/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <EditAnnouncementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="announcements"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminOverview}
                >
                  <AnnouncementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shops/:shopId/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShops}
                >
                  <AdminShopEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shops/:shopId"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShops}
                >
                  <AdminShopDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/delivery-companies/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminDeliveryCompanyFormPage mode="create" />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/delivery-companies/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminDeliveryCompanyFormPage mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/delivery-companies"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminDeliveryCompaniesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/pricing-rules/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminPricingRuleFormPage mode="create" />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/pricing-rules/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminPricingRuleFormPage mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="tax/new"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminTax}>
                  <AdminTaxFormPage mode="create" />
                </ProtectedRoute>
              }
            />
            <Route
              path="tax/:id/edit"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminTax}>
                  <AdminTaxFormPage mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="tax"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminTax}>
                  <AdminTaxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/pricing-rules"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminPricingRulesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/pricing-rules/:id"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminPricingRuleDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/weight-rates/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminWeightRateFormPage mode="create" />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/weight-rates/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminWeightRateFormPage mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/weight-rates"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminWeightRatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/weight-rates/:id"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminWeightRateDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/distance-ranges/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminDistanceRangeFormPage mode="create" />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/distance-ranges/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminDistanceRangeFormPage mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/distance-ranges"
              element={<Navigate to="/super-admin/shipping/pricing-rules" replace />}
            />
            <Route
              path="shipping/distance-ranges/:id"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminDistanceRangeDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/city-rates/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminCityRateFormPage mode="create" />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/city-rates/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminCityRateFormPage mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/city-rates"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminCityRatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/quotes/:id"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminDeliveryQuoteDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shipping/quotes"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminShipping}
                >
                  <AdminDeliveryQuotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="categories/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.categoriesManage}
                >
                  <NewCategoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="categories/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.categoriesManage}
                >
                  <EditCategoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="categories/:id"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.categoriesManage}
                >
                  <SellerCategoryDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="categories"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.categoriesManage}
                >
                  <SellerCategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="sellers"
              element={<Navigate to="/super-admin/shops" replace />}
            />
            <Route
              path="users"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminUsers}
                >
                  <AdminUsersPage />
                  {/* <DashboardPlaceholderPage
                    title="User Administration"
                    description="Global user operations, moderation, and support workflows are planned for this page."
                  /> */}
                </ProtectedRoute>
              }
            />
            <Route
              path="platform-users"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminUsers}>
                  <PlatformUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="invoices"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminInvoices}
                >
                  <AdminInvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="invoices/missing"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminInvoices}
                >
                  <AdminMissingInvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="invoices/:invoiceNumber"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminInvoices}
                >
                  <ScopedInvoiceDetailPage backTo="/super-admin/invoices" backLabel="Back to invoices" />
                </ProtectedRoute>
              }
            />
            <Route
              path="system"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminSystem}
                >
                  <DashboardPlaceholderPage
                    title="System Health"
                    description="Cross-service health indicators, incidents, and uptime reporting will live here."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminNotifications}
                >
                  <CommonNotificationsPage area="super_admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="mail"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminMail}
                >
                  <DashboardPlaceholderPage
                    title="Admin Mail"
                    description="Administrative inbox and internal communications will be managed here."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="chat"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminChat}
                >
                  <CommonChatPage area="super_admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="files"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminFiles}
                >
                  <DashboardPlaceholderPage
                    title="Admin Files"
                    description="Platform-level file assets and documents will be managed here."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminSettings}
                >
                  <CommonSettingsPage area="super_admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="help-support"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminHelpSupport}
                >
                  <CommonHelpSupportPage area="super_admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="rbac"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminRbac}
                >
                  <AdminRbacPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotion-engine"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.promotionsView}
                >
                  <PromotionEnginePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotion-engine/flash-deals"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.flashDealsView}
                >
                  <AdminFlashDealsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotion-engine/flash-deals/new"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.flashDealsView}
                >
                  <NewFlashDealPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotion-engine/flash-deals/:id/edit"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.flashDealsView}
                >
                  <EditFlashDealPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotion-engine/bundles"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.bundlesView}>
                  <AdminBundlesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotion-engine/bundles/new"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.bundlesView}>
                  <BundleFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="promotion-engine/bundles/:id/edit"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.bundlesView}>
                  <BundleFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting"
              element={<Navigate to="overview" replace />}
            />
            <Route
              path="accounting/overview"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}
                >
                  <AdminAccountingOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/income"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}
                >
                  <AdminIncomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/expenses"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}
                >
                  <AdminExpensePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/platform-expenses"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}>
                  <PlatformExpensesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/platform-expenses/new"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}>
                  <SellerExpenseFormPage scope="PLATFORM" />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/platform-expenses/:expenseId"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}>
                  <SellerExpenseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/platform-pending-approvals"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}>
                  <PlatformPendingApprovalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/platform-approval-policies"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}>
                  <PlatformApprovalPoliciesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/platform-approval-policies/new"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}>
                  <PlatformApprovalPoliciesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/platform-approval-policies/:policyId/edit"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}>
                  <PlatformApprovalPoliciesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/platform-approval-policies/:policyId/view"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}>
                  <PlatformApprovalPoliciesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/expense-categories"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}
                >
                  <AdminExpenseCategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/chart-of-accounts"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}
                >
                  <AdminChartOfAccountsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/journal-entries"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}
                >
                  <AdminJournalEntriesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="finance"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminFinanceOverview}
                >
                  <AdminFinanceOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounting/:section"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminAccounting}
                >
                  <DashboardPlaceholderPage
                    title="Accounting"
                    description="Platform accounting, payments, and financial reporting will be managed here."
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="finance/transactions"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.superAdminFinanceTransactions}
                >
                  <AdminFinanceTransactionsPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>
      </Route>

      {/* Public routes */}
      {/*
       * Print-only invoice route. Intentionally outside the session-guarded
       * block above: the headless PDF renderer has no browser session, so
       * authorisation comes from the short-lived, single-invoice print token
       * that the invoice service verifies server-side (signature, expiry,
       * scope, invoice number and ownership). Without a valid token the page
       * renders no invoice data.
       */}
      <Route
        path="/account/invoices/:invoiceNumber/print"
        element={<CustomerInvoicePrintPage />}
      />
      <Route
        path="/account/invoices/:invoiceNumber/receipt/print"
        element={<CustomerReceiptPrintPage />}
      />
      <Route path="/oauth-success" element={<OAuthSuccessPage />} />
      <Route path="/oauth-error" element={<OAuthErrorPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route
        path="/"
        element={
          <BuyerHomeRoute>
            <HomePage />
          </BuyerHomeRoute>
        }
      />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/shops/:shopId" element={<ShopPage />} />
      <Route path="/ai-assistant" element={<Navigate to="/" replace />} />
      <Route path="/all_categories" element={<CategoriesPage />} />
      <Route path="/categories/:id" element={<ProductListPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/help-centre" element={<HelpCenterPage />} />
      <Route
        path="/announcements/:announcementId"
        element={<AnnouncementDetailPage />}
      />
      <Route
        path="/help-centre/article/:categoryId/:itemIndex"
        element={<HelpArticlePage />}
      />
      <Route path="/help-centre/how-to-buy" element={<HelpArticlePage />} />
      <Route path="/help-centre/how-to-sell" element={<HelpArticlePage />} />
      <Route
        path="/help-centre/payment-methods"
        element={<HelpArticlePage />}
      />
      <Route
        path="/help-centre/ecommerce-coins"
        element={<HelpArticlePage />}
      />
      <Route
        path="/help-centre/ecommerce-guarantee"
        element={<HelpArticlePage />}
      />
      <Route path="/help-centre/return-refund" element={<HelpArticlePage />} />
      <Route
        path="/help-centre/mall-return-refund"
        element={<HelpArticlePage />}
      />
      <Route path="/help-centre/contact-us" element={<HelpArticlePage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/cart/see-more" element={<CartSeeMorePage />} />
      <Route
        path="/wishlist"
        element={
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        }
      />
      <Route path="/recently-added" element={<RecentlyAddedPage />} />
      <Route path="/about" element={<AboutUsPage />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/policies" element={<PoliciesPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/mall" element={<MallPage />} />
      <Route path="/seller-centre" element={<SellerCentrePage />} />
      <Route path="/seller-mentors" element={<SellerMentorsPage />} />
      <Route path="/flash-deals" element={<FlashDealsPage />} />
      <Route path="/media" element={<MediaContactPage />} />
      <Route path="/ambassador" element={<AmbassadorProgrammePage />} />

      {/* fallback */}
      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
