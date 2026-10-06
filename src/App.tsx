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
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget'
import { useNotificationRealtime } from '@/features/notifications/socket/useNotificationRealtime'

function App() {
  const dispatch = useAppDispatch() // Typed dispatch function to send actions
  const isAuthBootstrapping = useAppSelector(selectIsAuthBootstrapping)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const userId = useAppSelector((state) => state.auth.user?.id ?? null)
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  useNotificationRealtime({ userId, accessToken })
  const hideGlobalChrome =
    matchPath({ path: '/seller', end: true }, pathname) ||
    matchPath({ path: '/seller/*' }, pathname) ||
    matchPath({ path: '/super-admin', end: true }, pathname) ||
    matchPath({ path: '/super-admin/*' }, pathname) ||
    // Invoice print route renders only the invoice document.
    matchPath({ path: '/account/invoices/:invoiceNumber/print', end: true }, pathname)

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
   *
   * The invoice print route is exempt: it is rendered by the headless PDF
   * renderer, which has no session, and its authorisation comes from the
   * server-verified print token rather than the auth store. Waiting for the
   * auth bootstrap there would stall the PDF render.
   */
  const isInvoicePrintRoute = matchPath(
    { path: '/account/invoices/:invoiceNumber/print', end: true },
    pathname,
  );

  if (isAuthBootstrapping && !isInvoicePrintRoute) {
    return <AuthBootstrapLoading fullScreen />;
  }

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

      <AIAssistantWidget />
    </div>
  )
}

export default App
