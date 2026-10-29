import { Routes, Route, Navigate } from "react-router-dom";
import HomeFeaturesPage from "@/features/homeFeatures/pages/HomeFeaturesPage";
import NewHomeFeaturePage from "@/features/homeFeatures/pages/NewHomeFeaturePage";
import EditHomeFeaturePage from "@/features/homeFeatures/pages/EditHomeFeaturePage";
import HeroBannersPage from "@/features/heroBanners/pages/HeroBannersPage";
import NewHeroBannerPage from "@/features/heroBanners/pages/NewHeroBannerPage";
import EditHeroBannerPage from "@/features/heroBanners/pages/EditHeroBannerPage";
import PromoCardsPage from "@/features/promoCards/pages/PromoCardsPage";
import NewPromoCardPage from "@/features/promoCards/pages/NewPromoCardPage";
import EditPromoCardPage from "@/features/promoCards/pages/EditPromoCardPage";
import AnnouncementTypesPage from "@/features/announcements/pages/AnnouncementTypesPage";
import NewAnnouncementTypePage from "@/features/announcements/pages/NewAnnouncementTypePage";
import EditAnnouncementTypePage from "@/features/announcements/pages/EditAnnouncementTypePage";
import AnnouncementsPage from "@/features/announcements/pages/AnnouncementsPage";
import NewAnnouncementPage from "@/features/announcements/pages/NewAnnouncementPage";
import EditAnnouncementPage from "@/features/announcements/pages/EditAnnouncementPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import OAuthSuccessPage from "@/features/auth/pages/OAuthSuccessPage";
import OAuthErrorPage from "@/features/auth/pages/OAuthErrorPage";
import ForbiddenPage from "@/features/auth/pages/ForbiddenPage";
import { BuyerHomeRoute, GuestRoute, ProtectedRoute } from "./RouteGuards";
import RootEmployeeGuard from "./RootEmployeeGuard";
import HomePage from "@/features/home/HomePage";
import RecentlyAddedPage from "@/features/home/pages/RecentlyAddedPage";
import ProductListPage from "@/features/products/pages/ProductListPage";
import ProductDetailPage from "@/features/products/pages/ProductDetailPage";
import SearchPage from "@/features/search/pages/SearchPage";
import CartPage from "@/features/cart/pages/CartPage";
import CartSeeMorePage from "@/features/cart/pages/CartSeeMorePage";
import WishlistPage from "@/features/wishlist/pages/WishlistPage";
import CheckoutSuccessPage from "@/features/checkout/pages/CheckoutSuccessPage";
import CheckoutGatePage from "@/features/checkout/pages/CheckoutGatePage";
import GuestCheckoutPage from "@/features/checkout/pages/GuestCheckoutPage.tsx";
import GuestCheckoutSuccessPage from "@/features/checkout/pages/GuestCheckoutSuccessPage";
import CategoriesPage from "@/features/categories/pages/CategoriesPage";
import AboutUsPage from "@/features/about/pages/AboutUsPage";
import CareersPage from "@/features/careers/pages/CareersPage";
import AdminRbacPage from "@/features/admin/pages/AdminRbacPage";
import PoliciesPage from "@/features/policies/pages/PoliciesPage";
import PrivacyPolicyPage from "@/features/privacy/pages/PrivacyPolicyPage";
import BlogPage from "@/features/blog/pages/BlogPage";
import MallPage from "@/features/mall/pages/MallPage";
import ShopPage from "@/features/shops/pages/ShopPage";
import SellerCentrePage from "@/features/seller-centre/pages/SellerCentrePage";
import SellerMentorsPage from "@/features/seller-mentors/pages/SellerMentorsPage";
import FlashDealsPage from "@/features/flash-deals/pages/FlashDealsPage";
import MediaContactPage from "@/features/media/pages/MediaContactPage";
import AmbassadorProgrammePage from "@/features/ambassador/pages/AmbassadorProgrammePage";
import NotFoundPage from "@/features/common/pages/NotFoundPage";
import AccountLayout from "@/features/account/pages/AccountLayout";
import EmployeePortalLayout from "@/features/account/components/EmployeePortalLayout";
import ProfilePage from "@/features/account/pages/ProfilePage";
import BanksCardsPage from "@/features/account/pages/BanksCardsPage";
import AddressesPage from "@/features/account/pages/AddressesPage";
import ChangePasswordPage from "@/features/account/pages/ChangePasswordPage";
import NotificationsPage from "@/features/account/pages/NotificationsPage";
import NotificationsCenterPage from "@/features/account/pages/NotificationsCenterPage";
import OrdersPage from "@/features/account/pages/OrdersPage";
import OrderTrackingPage from "@/features/account/pages/OrderTrackingPage";
import CustomerInvoicesPage from "@/features/account/pages/CustomerInvoicesPage";
import CustomerInvoiceDetailPage from "@/features/account/pages/CustomerInvoiceDetailPage";
import CustomerInvoicePrintPage from "@/features/account/pages/CustomerInvoicePrintPage";
import ScopedInvoiceDetailPage from "@/features/invoices/pages/ScopedInvoiceDetailPage";
import VouchersPage from "@/features/account/pages/VouchersPage";
import CoinsPage from "@/features/account/pages/CoinsPage";
import { ROUTE_ACCESS } from "./routeAccessMap";
import DashboardLayout from "@/features/dashboard/components/layout/DashboardLayout";
import DashboardPlaceholderPage from "@/features/dashboard/components/layout/DashboardPlaceholderPage";
import WarehouseOverviewPage from "@/features/warehouse/pages/WarehouseOverviewPage";
import WarehousesPage from "@/features/warehouse/pages/WarehousesPage";
import WarehouseDetailPage from "@/features/warehouse/pages/WarehouseDetailPage";
import WarehouseFormPage from "@/features/warehouse/pages/WarehouseFormPage";
import EmployeesPage from "@/features/employees/pages/EmployeesPage";
import EmployeeFormPage from "@/features/employees/pages/EmployeeFormPage";
import EmployeeDetailPage from "@/features/employees/pages/EmployeeDetailPage";
import DepartmentsPage from "@/features/employees/pages/DepartmentsPage";
import DesignationsPage from "@/features/employees/pages/DesignationsPage";
import PositionsPage from "@/features/employees/pages/PositionsPage";
import SalaryGradesPage from "@/features/employees/pages/SalaryGradesPage";
import MyProfilePage from "@/features/employees/pages/MyProfilePage";
import AttendanceRecordsPage from "@/features/attendance/pages/AttendanceRecordsPage";
import ShiftsPage from "@/features/attendance/pages/ShiftsPage";
import ShiftSchedulesPage from "@/features/attendance/pages/ShiftSchedulesPage";
import OvertimeRequestsPage from "@/features/attendance/pages/OvertimeRequestsPage";
import MyAttendancePage from "@/features/attendance/pages/MyAttendancePage";
import LeaveTypesPage from "@/features/leave/pages/LeaveTypesPage";
import LeavePoliciesPage from "@/features/leave/pages/LeavePoliciesPage";
import LeaveSettingsPage from "@/features/leave/pages/LeaveSettingsPage";
import LeaveBalancesPage from "@/features/leave/pages/LeaveBalancesPage";
import LeaveRequestsPage from "@/features/leave/pages/LeaveRequestsPage";
import LeaveApprovalsPage from "@/features/leave/pages/LeaveApprovalsPage";
import MyLeavePage from "@/features/leave/pages/MyLeavePage";
import PayrollPoliciesPage from "@/features/payroll/pages/PayrollPoliciesPage";
import PayrollRunsPage from "@/features/payroll/pages/PayrollRunsPage";
import PayrollRunDetailPage from "@/features/payroll/pages/PayrollRunDetailPage";
import PayslipsPage from "@/features/payroll/pages/PayslipsPage";
import MyPayslipsPage from "@/features/payroll/pages/MyPayslipsPage";
import PaymentRecordsPage from "@/features/payroll/pages/PaymentRecordsPage";
import {
  PerformanceCyclesPage,
  KpisPage,
  PerformanceReviewsPage,
  PerformanceCycleDetailPage,
  PerformanceReviewDetailPage,
  BonusPoliciesPage,
  BonusAwardsPage,
  MyPerformancePage,
} from "@/features/performance/pages";
import InventoryPage from "@/features/warehouse/pages/InventoryPage";
import MovementsPage from "@/features/warehouse/pages/MovementsPage";
import AssignWarehouseManagerPage from "@/features/warehouse/pages/AssignWarehouseManagerPage";
import AssignDeliveryAgentPage from "@/features/warehouse/pages/AssignDeliveryAgentPage";
import StockOperationPage from "@/features/warehouse/pages/StockOperationPage";
import SuppliersPage from "@/features/purchase/pages/SuppliersPage";
import SupplierDetailPage from "@/features/purchase/pages/SupplierDetailPage";
import SupplierFormPage from "@/features/purchase/pages/SupplierFormPage";
import PurchaseOrdersPage from "@/features/purchase/pages/PurchaseOrdersPage";
import CreatePurchaseOrderPage from "@/features/purchase/pages/CreatePurchaseOrderPage";
import PurchaseReturnsPage from "@/features/purchase/pages/PurchaseReturnsPage";
import PurchaseReceiptsPage from "@/features/purchase/pages/PurchaseReceiptsPage";
import PurchaseOrderTrackingPage from "@/features/purchase/pages/PurchaseOrderTrackingPage";
import WarehouseOrderPage from "@/features/purchase/pages/WarehouseOrderPage";
import SellerWarehouseRequestsPage from "@/features/purchase/pages/SellerWarehouseRequestsPage";
import SellerWarehouseOrdersPage from "@/features/purchase/pages/SellerWarehouseOrdersPage";
import DeliveryParcelsPage from "@/features/purchase/pages/DeliveryParcelsPage";
import DamageReportsPage from "@/features/purchase/pages/DamageReportsPage";
import DeliveryOverviewPage from "@/features/purchase/pages/DeliveryOverviewPage";
import SellerOverviewPage from "@/features/seller/pages/SellerOverviewPage";
import SellerOrdersPage from "@/features/seller/pages/SellerOrdersPage";
import SellerOrderDetailPage from "@/features/seller/pages/SellerOrderDetailPage";
import SellerProductsPage from "@/features/seller/pages/SellerProductsPage";
import SellerUsersPage from "@/features/seller/pages/SellerUsersPage";
import SellerCategoriesPage from "@/features/seller/pages/SellerCategoriesPage";
import NewProductPage from "@/features/seller/pages/NewProductPage";
import EditProductPage from "@/features/seller/pages/EditProductPage";
import SellerProductDetailPage from "@/features/seller/pages/SellerProductDetailPage";
import NewCategoryPage from "@/features/seller/pages/NewCategoryPage";
import EditCategoryPage from "@/features/seller/pages/EditCategoryPage";
import SellerCategoryDetailPage from "@/features/seller/pages/SellerCategoryDetailPage";
import CatalogListPage from "@/features/seller/pages/CatalogListPage";
import CatalogFormPage from "@/features/seller/pages/CatalogFormPage";
import { CATALOG_ENTITY_CONFIG } from "@/features/seller/config/catalogEntityConfig";
import SellerNotificationsPage from "@/features/seller/pages/SellerNotificationsPage";
import SellerInvoicesPage from "@/features/seller/pages/SellerInvoicesPage";
import PaymentsPage from "@/features/seller/pages/PaymentsPage";
import PaymentDetailPage from "@/features/seller/pages/PaymentDetailPage";
import SellerChatPage from "@/features/seller/pages/SellerChatPage";
import SellerHelpSupportPage from "@/features/seller/pages/SellerHelpSupportPage";
import SellerRegisterPage from "@/features/seller/pages/SellerRegisterPage";
import AdminOverviewPage from "@/features/admin/pages/AdminOverviewPage";
import AdminShopDetailPage from "@/features/admin/pages/AdminShopDetailPage";
import AdminShopEditPage from "@/features/admin/pages/AdminShopEditPage";
import AdminShopsPage from "@/features/admin/pages/AdminShopsPage";
import AdminPricingRulesPage from "@/features/admin/pages/AdminPricingRulesPage";
import AdminTaxPage from "@/features/admin/pages/AdminTaxPage";
import AdminTaxFormPage from "@/features/admin/pages/AdminTaxFormPage";
import AdminPricingRuleFormPage from "@/features/admin/pages/AdminPricingRuleFormPage";
import AdminPricingRuleDetailPage from "@/features/admin/pages/AdminPricingRuleDetailPage";
import AdminWeightRatesPage from "@/features/admin/pages/AdminWeightRatesPage";
import AdminWeightRateFormPage from "@/features/admin/pages/AdminWeightRateFormPage";
import AdminWeightRateDetailPage from "@/features/admin/pages/AdminWeightRateDetailPage";
import AdminCityRatesPage from "@/features/admin/pages/AdminCityRatesPage";
import AdminDeliveryCompaniesPage from "@/features/admin/pages/AdminDeliveryCompaniesPage";
import AdminDeliveryCompanyFormPage from "@/features/admin/pages/AdminDeliveryCompanyFormPage";
import AdminCityRateFormPage from "@/features/admin/pages/AdminCityRateFormPage";
import AdminDistanceRangeFormPage from "@/features/admin/pages/AdminDistanceRangeFormPage";
import AdminDistanceRangeDetailPage from "@/features/admin/pages/AdminDistanceRangeDetailPage";
import AdminDeliveryQuotesPage from "@/features/admin/pages/AdminDeliveryQuotesPage";
import AdminDeliveryQuoteDetailPage from "@/features/admin/pages/AdminDeliveryQuoteDetailPage";
import AdminUsersPage from "@/features/admin/pages/AdminUsersPage";
import PlatformUsersPage from "@/features/admin/pages/PlatformUsersPage";
import AdminInvoicesPage from "@/features/admin/pages/AdminInvoicesPage";
import AdminMissingInvoicesPage from "@/features/admin/pages/AdminMissingInvoicesPage";
import AdminIncomePage from "@/features/admin/pages/AdminIncomePage";
import AdminExpensePage from "@/features/admin/pages/AdminExpensePage";
import AdminExpenseCategoriesPage from "@/features/admin/pages/AdminExpenseCategoriesPage";
import SellerDeliveryCompanyFeesPage from "@/features/seller/pages/SellerDeliveryCompanyFeesPage";
import SellerDeliveryCompaniesPage from "@/features/seller/pages/SellerDeliveryCompaniesPage";
import CommonNotificationsPage from "@/features/common/pages/CommonNotificationsPage";
import CommonChatPage from "@/features/common/pages/CommonChatPage";
import CommonHelpSupportPage from "@/features/common/pages/CommonHelpSupportPage";
import CommonSettingsPage from "@/features/common/pages/CommonSettingsPage";
import HelpCenterPage from "@/features/help-center/components/HelpCenterPage";
import HelpArticlePage from "@/features/help-center/components/HelpArticlePage";
import AnnouncementDetailPage from "@/features/announcements/pages/AnnouncementDetailPage";
import { PhoneAuthPage } from "@/features/auth/pages/PhoneAuthPage";
import { PhoneOtpPage } from "@/features/auth/pages/PhoneOtpPage";
import PromotionEnginePage from "@/features/promotions/pages/PromotionEnginePage";
import AdminFlashDealsPage from "@/features/flash-deals/pages/AdminFlashDealsPage";
import NewFlashDealPage from "@/features/flash-deals/pages/NewFlashDealPage";
import EditFlashDealPage from "@/features/flash-deals/pages/EditFlashDealPage";
import AdminBundlesPage from "@/features/bundles/pages/AdminBundlesPage";
import BundleFormPage from "@/features/bundles/pages/BundleFormPage";
import SellerFinanceOverviewPage from "@/features/finance/pages/SellerFinanceOverviewPage";
import SellerFinanceTransactionsPage from "@/features/finance/pages/SellerFinanceTransactionsPage";
import SellerAccountingOverviewPage from "@/features/accounting/pages/SellerAccountingOverviewPage";
import SellerProfitLossPage from "@/features/accounting/pages/SellerProfitLossPage";
import SellerExpenseFormPage from "@/features/accounting/pages/SellerExpenseFormPage";
import SellerExpensesPage from "@/features/accounting/pages/SellerExpensesPage";
import SellerPendingApprovalsPage from "@/features/accounting/pages/SellerPendingApprovalsPage";
import SellerExpenseDetailPage from "@/features/accounting/pages/SellerExpenseDetailPage";
import SellerIncomePage from "@/features/accounting/pages/SellerIncomePage";
import SellerJournalEntriesPage from "@/features/accounting/pages/SellerJournalEntriesPage";
import SellerApprovalPoliciesPage from "@/features/accounting/pages/SellerApprovalPoliciesPage";
import SellerApprovalPolicyFormPage from "@/features/accounting/pages/SellerApprovalPolicyFormPage";
import AdminFinanceOverviewPage from "@/features/finance/pages/AdminFinanceOverviewPage";
import AdminFinanceTransactionsPage from "@/features/finance/pages/AdminFinanceTransactionsPage";
import AdminAccountingOverviewPage from "@/features/accounting/pages/AdminAccountingOverviewPage";
import AdminChartOfAccountsPage from "@/features/accounting/pages/AdminChartOfAccountsPage";
import AdminJournalEntriesPage from "@/features/accounting/pages/AdminJournalEntriesPage";
import PlatformExpensesPage from "@/features/admin/pages/PlatformExpensesPage";
import PlatformApprovalPoliciesPage from "@/features/admin/pages/PlatformApprovalPoliciesPage";
import PlatformPendingApprovalsPage from "@/features/admin/pages/PlatformPendingApprovalsPage";

const AppRoutes = () => {
  return (
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
              path="orders/:orderId"
              element={
                <ProtectedRoute
                  requiredCapabilities={ROUTE_ACCESS.accountOrders}
                >
                  <OrderTrackingPage />
                </ProtectedRoute>
              }
            />
            <Route path="invoices" element={<CustomerInvoicesPage />} />
            <Route path="invoices/:invoiceNumber" element={<CustomerInvoiceDetailPage />} />
            <Route path="my-vouchers" element={<VouchersPage />} />
            <Route path="my-coins" element={<CoinsPage />} />
          </Route>
        </Route>

        {/* Employee Leave Portal - unified entry point that routes based on department/position */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute
              requiredCapabilities={ROUTE_ACCESS.leaveMy}
              allowEmployees
            >
              <EmployeePortalLayout />
            </ProtectedRoute>
          }
        >
          <Route path="my-leave" element={<MyLeavePage />} />
        </Route>

        {/* Direct department portal routes (for bookmarks/deep links) */}
        <Route
          path="/warehouse"
          element={
            <ProtectedRoute
              requiredCapabilities={ROUTE_ACCESS.leaveMy}
              allowEmployees
            >
              <DashboardLayout area="warehouse_manager" />
            </ProtectedRoute>
          }
        >
          <Route path="my-leave" element={<MyLeavePage />} />
        </Route>

        <Route
          path="/delivery"
          element={
            <ProtectedRoute
              requiredCapabilities={ROUTE_ACCESS.leaveMy}
              allowEmployees
            >
              <DashboardLayout area="delivery_agent" />
            </ProtectedRoute>
          }
        >
          <Route path="my-leave" element={<MyLeavePage />} />
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
          path="/attendance"
          element={
            <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.attendanceMy}>
              <MyAttendancePage />
            </ProtectedRoute>
          }
        />
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
              path="delivery-companies"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerDeliveryCompanies}>
                  <SellerDeliveryCompaniesPage />
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
            <Route
              path="leave/requests"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseLeaveRequests}>
                  <LeaveRequestsPage hideCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="leave/approvals"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.warehouseLeaveApprovals}>
                  <LeaveApprovalsPage scopeToCurrentUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="leave/me"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.leaveMy}>
                  <MyLeavePage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>
        <Route path="/payroll" element={<DashboardLayout area="payroll" />}>
          <Route
            element={
              <ProtectedRoute
                requiredCapabilities={ROUTE_ACCESS.payrollDashboard}
                allowedRoles={[
                  "SUPER_ADMIN",
                  "HR_MANAGER",
                  "PAYROLL_OFFICER",
                  "PAYROLL_APPROVER",
                  "FINANCE",
                ]}
              />
            }
          >
            <Route index element={<Navigate to="runs" replace />} />
            <Route
              path="policies"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.payrollPolicies}>
                  <PayrollPoliciesPage root="/payroll" />
                </ProtectedRoute>
              }
            />
            <Route
              path="runs"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.payrollRuns}>
                  <PayrollRunsPage root="/payroll" />
                </ProtectedRoute>
              }
            />
            <Route
              path="runs/:id"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.payrollRuns}>
                  <PayrollRunDetailPage root="/payroll" />
                </ProtectedRoute>
              }
            />
            <Route
              path="payslips"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.payrollPayslips}>
                  <PayslipsPage root="/payroll" />
                </ProtectedRoute>
              }
            />
            <Route
              path="payslips/me"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.payrollMyPayslips}>
                  <MyPayslipsPage root="/payroll" />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.payrollPayments}>
                  <PaymentRecordsPage root="/payroll" />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/cycles"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.performanceCycles}>
                  <PerformanceCyclesPage root="/payroll/performance" />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/cycles/:id"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.performanceCycles}>
                  <PerformanceCycleDetailPage root="/payroll/performance" />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/kpis"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.performanceKpis}>
                  <KpisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/reviews"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.performanceReviews}>
                  <PerformanceReviewsPage root="/payroll/performance" />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/reviews/:id"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.performanceReviews}>
                  <PerformanceReviewDetailPage root="/payroll/performance" />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/bonus-policies"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.bonusPolicies}>
                  <BonusPoliciesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/bonus-awards"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.bonusAwards}>
                  <BonusAwardsPage root="/payroll/performance" />
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
                allowedRoles={["SUPER_ADMIN", "HR_MANAGER"]}
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

            <Route
              path="employees"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminEmployees}>
                  <EmployeesPage base="/super-admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/new"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminEmployees}>
                  <EmployeeFormPage base="/super-admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/departments"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminEmployees}>
                  <DepartmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/positions"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminEmployees}>
                  <PositionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/designations"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminEmployees}>
                  <DesignationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/salary-grades"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminEmployees}>
                  <SalaryGradesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/me"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminEmployees}>
                  <MyProfilePage base="/super-admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/:id/edit"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminEmployees}>
                  <EmployeeFormPage base="/super-admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/:id"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminEmployees}>
                  <EmployeeDetailPage base="/super-admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="attendance"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.attendanceRecords}>
                  <AttendanceRecordsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="attendance/me"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.attendanceMy}>
                  <MyAttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shifts"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.attendanceShifts}>
                  <ShiftsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="shift-schedules"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.attendanceSchedules}>
                  <ShiftSchedulesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="overtime-requests"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.attendanceOvertime}>
                  <OvertimeRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="leave-settings"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.leaveConfig}>
                  <LeaveSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="leave-types"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.leaveConfig}>
                  <LeaveTypesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="leave-policies"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.leaveConfig}>
                  <LeavePoliciesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="leave-balances"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.leaveBalances}>
                  <LeaveBalancesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="leave-requests"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.leaveRequests}>
                  <LeaveRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="leave-approvals"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.leaveApprovals}>
                  <LeaveApprovalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="leave/me"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.leaveMy}>
                  <MyLeavePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="payroll/policies"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.payrollPolicies}>
                  <PayrollPoliciesPage root="/super-admin/payroll" />
                </ProtectedRoute>
              }
            />
            <Route
              path="payroll/runs"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.payrollRuns}>
                  <PayrollRunsPage root="/super-admin/payroll" />
                </ProtectedRoute>
              }
            />
            <Route
              path="payroll/runs/:id"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.payrollRuns}>
                  <PayrollRunDetailPage root="/super-admin/payroll" />
                </ProtectedRoute>
              }
            />
            <Route
              path="payroll/payslips"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.payrollPayslips}>
                  <PayslipsPage root="/super-admin/payroll" />
                </ProtectedRoute>
              }
            />
            <Route
              path="payroll/payslips/me"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.payrollMyPayslips}>
                  <MyPayslipsPage root="/super-admin/payroll" />
                </ProtectedRoute>
              }
            />
            <Route
              path="payroll/payments"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.payrollPayments}>
                  <PaymentRecordsPage root="/super-admin/payroll" />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/cycles"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.performanceCycles}>
                  <PerformanceCyclesPage root="/super-admin/performance" />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/cycles/:id"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.performanceCycles}>
                  <PerformanceCycleDetailPage root="/super-admin/performance" />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/kpis"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.performanceKpis}>
                  <KpisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/reviews"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.performanceReviews}>
                  <PerformanceReviewsPage root="/super-admin/performance" />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/reviews/:id"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.performanceReviews}>
                  <PerformanceReviewDetailPage root="/super-admin/performance" />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/bonus-policies"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.bonusPolicies}>
                  <BonusPoliciesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/bonus-awards"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.bonusAwards}>
                  <BonusAwardsPage root="/super-admin/performance" />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance/me"
              element={
                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.performanceMy}>
                  <MyPerformancePage />
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
      <Route path="/oauth-success" element={<OAuthSuccessPage />} />
      <Route path="/oauth-error" element={<OAuthErrorPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route
        path="/"
        element={
          <BuyerHomeRoute>
            <RootEmployeeGuard>
              <HomePage />
            </RootEmployeeGuard>
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
  );
};

export default AppRoutes;

