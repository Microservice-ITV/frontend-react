import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { selectAuthUser, selectIsAuthenticated, selectIsAuthBootstrapping } from '@/features/auth/store/authSelectors'
import { Typing } from '@/components/loading-ui/typing'
import { getEmployeePortalRoute } from '@/features/employees/utils/employeePortal'
import { useEffect, useState, type ReactNode } from 'react'
import { selectRoleCapabilities } from '@/app/rbac/selectors'

/**
 * Root-level guard that redirects authenticated employees away from the storefront homepage
 * to their department-specific portal.
 * 
 * This runs at the root level before any storefront chrome is rendered.
 */
export const RootEmployeeGuard = ({ children }: { children: ReactNode }) => {
  const isAuthBootstrapping = useAppSelector(selectIsAuthBootstrapping)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const authUser = useAppSelector(selectAuthUser)
  const userCapabilities = useAppSelector(selectRoleCapabilities)
  const location = useLocation()
  const [portalRoute, setPortalRoute] = useState<string | null>(null)
  const [redirectChecked, setRedirectChecked] = useState(false)

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!isAuthenticated || !authUser || isAuthBootstrapping || location.pathname !== '/') {
        setRedirectChecked(true)
        return
      }

      try {
        const route = await getEmployeePortalRoute(userCapabilities)
        if (route) {
          setPortalRoute(route)
        }
      } catch {
        // Swallow errors – user stays on homepage
      } finally {
        setRedirectChecked(true)
      }
    }

    checkAndRedirect()
  }, [isAuthenticated, authUser, isAuthBootstrapping, location.pathname, userCapabilities])

  // Show loading only while the check is in flight
  if (!redirectChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Typing className="w-8" />
      </div>
    )
  }

  // If user is an employee, redirect to their portal
  if (portalRoute) {
    return <Navigate to={portalRoute} replace />
  }

  // No employee profile – render normal homepage
  return <>{children}</>
}

export default RootEmployeeGuard