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
import SellerDashboardPage from '@/features/seller/pages/SellerDashboardPage'
import SuperAdminDashboardPage from '@/features/admin/pages/SuperAdminDashboardPage'

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
                        <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.sellerDashboard}>
                            <SellerDashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/super-admin"
                    element={
                        <ProtectedRoute requiredCapabilities={ROUTE_ACCESS.superAdminDashboard}>
                            <SuperAdminDashboardPage />
                        </ProtectedRoute>
                    }
                />
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