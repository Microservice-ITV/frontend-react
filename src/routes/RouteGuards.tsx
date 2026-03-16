import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { selectAuthUser, selectIsAuthenticated } from '@/features/auth/store/authSelectors'
import type { Capability } from '@/app/rbac/types'
import { canAny } from '@/app/rbac/selectors'
import { extractRoleFromUser } from '@/app/rbac/normalizers'
import { getDefaultLandingPathByRole } from '@/app/rbac/navigation'
import type { ReactNode } from 'react'

// ================= GuestRoute =================
export const GuestRoute = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const authUser = useAppSelector(selectAuthUser)
  const location = useLocation()

  // Keep users on guest pages until profile is loaded; this avoids redirecting
  // to "/" before role resolution is available right after login.
  if (isAuthenticated && !authUser) {
    return <Outlet />
  }

  // If user is already logged in:
  // - go back to where they came from (e.g. /checkout)
  // - or fallback to role landing page if no `from` is provided
  const from = (location.state as { from?: Location })?.from?.pathname || '/'

  if (isAuthenticated && authUser) {
    const role = extractRoleFromUser(authUser)
    const fallback = getDefaultLandingPathByRole(role)
    const target = from !== '/' ? from : fallback
    return <Navigate to={target} replace />
  }

  return <Outlet />
}

// ================= ProtectedRoute =================
type ProtectedRouteProps = {
  requiredCapabilities?: readonly Capability[]
  unauthorizedRedirectTo?: string
  children?: ReactNode
}

export const ProtectedRoute = ({
  requiredCapabilities = [],
  unauthorizedRedirectTo = '/forbidden',
  children,
}: ProtectedRouteProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const hasRequiredCapabilities = useAppSelector((state) => canAny(state, requiredCapabilities))
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

  if (requiredCapabilities.length > 0 && !hasRequiredCapabilities) {
    return <Navigate to={unauthorizedRedirectTo} replace />
  }

  if (children) {
    return <>{children}</>
  }

  return <Outlet />
}

// ================= BuyerHomeRoute =================
type BuyerHomeRouteProps = {
  children: ReactNode
}

export const BuyerHomeRoute = ({ children }: BuyerHomeRouteProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const authUser = useAppSelector(selectAuthUser)

  if (!isAuthenticated || !authUser) {
    return <>{children}</>
  }

  const role = extractRoleFromUser(authUser)
  if (role !== 'USER') {
    return <Navigate to={getDefaultLandingPathByRole(role)} replace />
  }

  return <>{children}</>
}