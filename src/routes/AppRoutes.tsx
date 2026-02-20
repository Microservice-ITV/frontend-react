import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import OAuthSuccessPage from '@/features/auth/pages/OAuthSuccessPage'
import OAuthErrorPage from '@/features/auth/pages/OAuthErrorPage'
import { GuestRoute, ProtectedRoute } from './RouteGuards'
import HomePage from '@/features/home/HomePage'
import ProductListPage from '@/features/products/pages/ProductListPage'
import ProductDetailPage from '@/features/products/pages/ProductDetailPage'
import CartPage from '@/features/cart/pages/CartPage'
import CheckoutPage from '@/features/checkout/pages/CheckoutPage'
import CheckoutSuccessPage from '@/features/checkout/pages/CheckoutSuccessPage'

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
                <Route path="/account" element={<div>My Account</div>} />
                <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
            </Route>

            {/* Public routes */}
            <Route path="/oauth-success" element={<OAuthSuccessPage />} />
            <Route path="/oauth-error" element={<OAuthErrorPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/categories/:id" element={<ProductListPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes