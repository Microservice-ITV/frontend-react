import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import OAuthSuccessPage from '@/features/auth/pages/OAuthSuccessPage'
import OAuthErrorPage from '@/features/auth/pages/OAuthErrorPage'
import ForbiddenPage from '@/features/auth/pages/ForbiddenPage'
import { BuyerHomeRoute, GuestRoute, ProtectedRoute } from './RouteGuards'
import HomePage from '@/features/home/HomePage'
import ProductListPage from '@/features/products/pages/ProductListPage'
import ProductDetailPage from '@/features/products/pages/ProductDetailPage'
import CartPage from '@/features/cart/pages/CartPage'
import CheckoutPage from '@/features/checkout/pages/CheckoutPage'
import CheckoutSuccessPage from '@/features/checkout/pages/CheckoutSuccessPage'
import CategoriesPage from '@/features/categories/pages/CategoriesPage'
import AccountLayout from '@/features/account/pages/AccountLayout'
import ProfilePage from '@/features/account/pages/ProfilePage'
import BanksCardsPage from '@/features/account/pages/BanksCardsPage'
import AddressesPage from '@/features/account/pages/AddressesPage'
import ChangePasswordPage from '@/features/account/pages/ChangePasswordPage'
import NotificationsPage from '@/features/account/pages/NotificationsPage'
import NotificationsCenterPage from '@/features/account/pages/NotificationsCenterPage'
import OrdersPage from '@/features/account/pages/OrdersPage'
import VouchersPage from '@/features/account/pages/VouchersPage'
import CoinsPage from '@/features/account/pages/CoinsPage'
import { ROUTE_ACCESS } from './routeAccessMap'
import DashboardLayout from '@/features/dashboard/components/layout/DashboardLayout'
import DashboardPlaceholderPage from '@/features/dashboard/components/layout/DashboardPlaceholderPage'
import SellerOverviewPage from '@/features/seller/pages/SellerOverviewPage'
import SellerOrdersPage from '@/features/seller/pages/SellerOrdersPage'
import SellerProductsPage from '@/features/seller/pages/SellerProductsPage'
import SellerCategoriesPage from '@/features/seller/pages/SellerCategoriesPage'
import NewProductPage from '@/features/seller/pages/NewProductPage'
import EditProductPage from '@/features/seller/pages/EditProductPage'
import SellerProductDetailPage from '@/features/seller/pages/SellerProductDetailPage'
import NewCategoryPage from '@/features/seller/pages/NewCategoryPage'
import EditCategoryPage from '@/features/seller/pages/EditCategoryPage'
import SellerCategoryDetailPage from '@/features/seller/pages/SellerCategoryDetailPage'
import SellerNotificationsPage from '@/features/seller/pages/SellerNotificationsPage'
import SellerInvoicesPage from '@/features/seller/pages/SellerInvoicesPage'
import SellerChatPage from '@/features/seller/pages/SellerChatPage'
import SellerHelpSupportPage from '@/features/seller/pages/SellerHelpSupportPage'
import AdminOverviewPage from '@/features/admin/pages/AdminOverviewPage'
import AdminShopsPage from '@/features/admin/pages/AdminShopsPage'
import CommonNotificationsPage from '@/features/common/pages/CommonNotificationsPage'
import CommonChatPage from '@/features/common/pages/CommonChatPage'
import CommonHelpSupportPage from '@/features/common/pages/CommonHelpSupportPage'
import CommonSettingsPage from '@/features/common/pages/CommonSettingsPage'

const AppRoutes = () => {
    return (
        <Routes>
            {/* Guest-only routes */}
            <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
                <Route
                    path="/account"
                    element={<ProtectedRoute requiredCapabilities={ROUTE_ACCESS.accountRoot} />}
                >
                    <Route element={<AccountLayout />}>
                    <Route index element={<ProfilePage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="banks-cards" element={<BanksCardsPage />} />
                    <Route
                        path="addresses"
                        element={
                            <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.accountAddresses}>
                                <AddressesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="change-password" element={<ChangePasswordPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="notifications-center" element={<NotificationsCenterPage />} />
                    <Route
                        path="orders"
                        element={
                            <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.accountOrders}>
                                <OrdersPage />
                            </ProtectedRoute>
                        }
                    />
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
                <Route
                    path="/checkout"
                    element={
                        <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.checkout}>
                            <CheckoutPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/seller"
                    element={
                        <ProtectedRoute
                            requiredCapabilities={ROUTE_ACCESS.sellerDashboard}
                            allowedRoles={['SHOP_OWNER', 'SHOP_ADMIN']}
                        />
                    }
                >
                    <Route element={<DashboardLayout area="seller" />}>
                        <Route index element={<Navigate to="overview" replace />} />
                        <Route
                            path="overview"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerOverview}>
                                    <SellerOverviewPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="analytics"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerAnalytics}>
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
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerOrders}>
                                    <SellerOrdersPage />
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
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerCategoriesView}>
                                    <SellerCategoryDetailPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="categories"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerCategoriesView}>
                                    <SellerCategoriesPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="products/new"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerProducts}>
                                    <NewProductPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="products/:id/edit"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerProducts}>
                                    <EditProductPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="products/:id"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerProducts}>
                                    <SellerProductDetailPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="products"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerProducts}>
                                    <SellerProductsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="invoices"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerInvoices}>
                                    <SellerInvoicesPage />
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
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerNotifications}>
                                    <SellerNotificationsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="settings"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerSettings}>
                                    <CommonSettingsPage area="seller" />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="help-support"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerHelpSupport}>
                                    <SellerHelpSupportPage />
                                </ProtectedRoute>
                            }
                        />
                    </Route>
                </Route>
                <Route
                    path="/super-admin"
                    element={
                        <ProtectedRoute
                            requiredCapabilities={ROUTE_ACCESS.superAdminDashboard}
                            allowedRoles={['SUPER_ADMIN']}
                        />
                    }
                >
                    <Route element={<DashboardLayout area="super_admin" />}>
                        <Route index element={<Navigate to="overview" replace />} />
                        <Route
                            path="overview"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminOverview}>
                                    <AdminOverviewPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="analytics"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminOverview}>
                                    <DashboardPlaceholderPage
                                        title="Platform Analytics"
                                        description="Cross-shop analytics, usage trends, and performance metrics will be implemented here."
                                    />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="shops"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminShops}>
                                    <AdminShopsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="categories/new"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.categoriesManage}>
                                    <NewCategoryPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="categories/:id/edit"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.categoriesManage}>
                                    <EditCategoryPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="categories/:id"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.categoriesManage}>
                                    <SellerCategoryDetailPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="categories"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.categoriesManage}>
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
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminUsers}>
                                    <DashboardPlaceholderPage
                                        title="User Administration"
                                        description="Global user operations, moderation, and support workflows are planned for this page."
                                    />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="system"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminSystem}>
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
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminNotifications}>
                                    <CommonNotificationsPage area="super_admin" />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="mail"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminMail}>
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
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminChat}>
                                    <CommonChatPage area="super_admin" />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="files"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminFiles}>
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
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminSettings}>
                                    <CommonSettingsPage area="super_admin" />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="help-support"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminHelpSupport}>
                                    <CommonHelpSupportPage area="super_admin" />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="rbac"
                            element={
                                <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminRbac}>
                                    <DashboardPlaceholderPage
                                        title="RBAC Administration"
                                        description="Role, permission, and assignment governance for platform operations will be added here."
                                    />
                                </ProtectedRoute>
                            }
                        />
                    </Route>
                </Route>
            </Route>

            {/* Public routes */}
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
            <Route path="/all_categories" element={<CategoriesPage />} />
            <Route path="/categories/:id" element={<ProductListPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes