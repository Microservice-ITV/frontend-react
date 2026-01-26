import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { GuestRoute, ProtectedRoute } from './RouteGuards'
import HomePage from '@/features/home/HomePage'
import ProductListPage from '@/features/products/pages/ProductListPage'
import ProductDetailPage from '@/features/products/pages/ProductDetailPage'

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
            </Route>

            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/categories/:id" element={<ProductListPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes