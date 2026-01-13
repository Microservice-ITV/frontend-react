import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'

// ================= GuestRoute | Blocks authenticated users from visiting login/register =================
export const GuestRoute = () => {
  const { isAuthenticated } = useAppSelector((s) => s.auth)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

// ================== ProtectedRoute | Blocks unauthenticated users from private pages ===================
export const ProtectedRoute = () => {
  const { isAuthenticated } = useAppSelector((s) => s.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}