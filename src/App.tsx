import { useEffect } from 'react'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { bootstrapAuth, fetchMe } from '@/features/auth/store/authThunks'
import Navbar from '@/components/layouts/navbar/Navbar'
import Footer from '@/components/layouts/Footer'
import AppRoutes from '@/routes/AppRoutes'
import { selectIsAuthBootstrapping } from './features/auth/store/authSelectors'
import ScrollToTop from './components/routing/ScrollToTop'
import GoogleAnalytics from './components/analytics/GoogleAnalytics'
import { setAccessToken, setHasSession } from './features/auth/store/authSlice'
import { setSessionCookie } from '@/utils/session'
import { extractRoleFromUser } from '@/app/rbac/normalizers'
import { getDefaultLandingPathByRole } from '@/app/rbac/navigation'
import AuthBootstrapLoading from '@/components/ui/AuthBootstrapLoading'

function App() {
  const dispatch = useAppDispatch() // Typed dispatch function to send actions
  const isAuthBootstrapping = useAppSelector(selectIsAuthBootstrapping)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const hideGlobalChrome =
    matchPath({ path: '/seller', end: true }, pathname) ||
    matchPath({ path: '/seller/*' }, pathname) ||
    matchPath({ path: '/super-admin', end: true }, pathname) ||
    matchPath({ path: '/super-admin/*' }, pathname)

  /**
   * Bootstrap authentication on app load
   * - Checks for existing access token (In Cookies)
   * - Attempts to fetch current user (/me)
   * - If access token is expired, Axios interceptor attempts refresh
   * - If refresh fails, auth state resets to unauthenticated
 */
  useEffect(() => {
    dispatch(bootstrapAuth())
  }, [dispatch])

  /**
   * Listen for OAuth success messages from popup windows
   */
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (!event.data || event.data.type !== 'OAUTH_SUCCESS') return

      const token = event.data.token
      if (!token || typeof token !== 'string') return

      try {
        dispatch(setAccessToken(token))
        dispatch(setHasSession(true))
        setSessionCookie()
        const user = await dispatch(fetchMe()).unwrap()
        const role = extractRoleFromUser(user)
        navigate(getDefaultLandingPathByRole(role), { replace: true })
      } catch {
        // Ignore failures; user can retry login
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [dispatch, navigate])

  /**
   * Prevent UI flicker during authentication bootstrap
   */
  if (isAuthBootstrapping) return <AuthBootstrapLoading fullScreen />

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      {!hideGlobalChrome && <Navbar />}

      <ScrollToTop />
      <GoogleAnalytics />

      {/* Main Content */}
      <main className="flex-1">
        <AppRoutes />
      </main>

      {!hideGlobalChrome && <Footer />}
    </div>
  )
}

export default App
