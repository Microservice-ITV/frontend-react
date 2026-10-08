import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { selectAuthUser, selectIsAuthenticated, selectIsAuthBootstrapping } from '@/features/auth/store/authSelectors'
import type { Capability } from '@/app/rbac/types'
import type { AppRole } from '@/app/rbac/types'
import { canAny } from '@/app/rbac/selectors'
import { extractRoleFromUser } from '@/app/rbac/normalizers'
import { getDefaultLandingPathByRole, resolvePostLoginPath } from '@/app/rbac/navigation'
import type { ReactNode } from 'react'
import { Typing } from '@/components/loading-ui/typing'

const ContentLoading = () => (
  <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center">
    <Typing className="w-8" />
  </div>
)

// ================= GuestRoute =================
export const GuestRoute = () => {
  const isAuthBootstrapping = useAppSelector(selectIsAuthBootstrapping)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const authUser = useAppSelector(selectAuthUser)
  const location = useLocation()
  const isPhoneAuthRoute = location.pathname === '/phone-auth' || location.pathname === '/phone-verify'

  // Phone authentication must remain usable while the regular session bootstrap
  // settles; its own request/verify flow determines whether a session is created.
  if (isPhoneAuthRoute) return <Outlet />

  // Same account-not-ready wait already used by protected pages.
  if (isAuthBootstrapping || (isAuthenticated && !authUser)) {
    return <ContentLoading />
  }

  // If user is already logged in:
  // - go back to where they came from (e.g. /checkout)
  // - or fallback to role landing page if no `from` is provided
  const from = (location.state as { from?: Location })?.from?.pathname || '/'

  if (isAuthenticated && authUser) {
    const role = extractRoleFromUser(authUser)
    const target = resolvePostLoginPath(role, from)
    return <Navigate to={target} replace />
  }

  return <Outlet />
}

// ================= ProtectedRoute =================
type ProtectedRouteProps = {
  requiredCapabilities?: readonly Capability[]
  allowedRoles?: readonly AppRole[]
  unauthorizedRedirectTo?: string
  children?: ReactNode
}

export const ProtectedRoute = ({
  requiredCapabilities = [],
  allowedRoles,
  unauthorizedRedirectTo = '/forbidden',
  children,
}: ProtectedRouteProps) => {
  const isAuthBootstrapping = useAppSelector(selectIsAuthBootstrapping)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const authUser = useAppSelector(selectAuthUser)
  const hasRequiredCapabilities = useAppSelector((state) => canAny(state, requiredCapabilities))
  const location = useLocation()

  if (isAuthBootstrapping) return <ContentLoading />

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  // Access token present (e.g. after refresh) but /me not loaded yet — avoid rendering
  // protected pages while the navbar still shows Login/Register.
  if (!authUser) return <ContentLoading />

  if (requiredCapabilities.length > 0 && !hasRequiredCapabilities) {
    return <Navigate to={unauthorizedRedirectTo} replace />
  }

  if (allowedRoles && authUser) {
    const role = extractRoleFromUser(authUser)
    if (!allowedRoles.includes(role)) {
      return <Navigate to={unauthorizedRedirectTo} replace />
    }
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
  const isAuthBootstrapping = useAppSelector(selectIsAuthBootstrapping)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const authUser = useAppSelector(selectAuthUser)

  if (isAuthBootstrapping) return <ContentLoading />

  if (!isAuthenticated || !authUser) {
    return <>{children}</>
  }

  const role = extractRoleFromUser(authUser)
  if (role !== 'USER') {
    return <Navigate to={getDefaultLandingPathByRole(role)} replace />
  }

  return <>{children}</>
}