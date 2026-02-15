import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors'

// ================= GuestRoute =================
export const GuestRoute = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()

  // If user is already logged in:
  // - go back to where they came from (e.g. /checkout)
  // - or fallback to home if no `from` is provided
  const from = (location.state as { from?: Location })?.from?.pathname || '/'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  return <Outlet />
}

// ================= ProtectedRoute =================
export const ProtectedRoute = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  return <Outlet />
}