import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { GuestRoute, ProtectedRoute } from './RouteGuards'
import HomePage from '@/pages/HomePage'

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

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes