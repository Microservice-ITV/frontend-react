import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { bootstrapAuth, fetchMe } from '@/features/auth/store/authThunks'
import Navbar from '@/components/layouts/navbar/Navbar'
import Footer from '@/components/layouts/Footer'
import AppRoutes from '@/routes/AppRoutes'
import ScrollToTop from './components/routing/ScrollToTop'
import GoogleAnalytics from './components/analytics/GoogleAnalytics'
import { setAccessToken, setHasSession } from './features/auth/store/authSlice'
import { setSessionCookie } from '@/utils/session'
import { extractRoleFromUser } from '@/app/rbac/normalizers'
import { getDefaultLandingPathByRole } from '@/app/rbac/navigation'
import SpinPage from '@/components/spin/SpinPage'
import { HomeScreenReadyProvider } from '@/features/home/homeScreenReady'
import { useNotificationRealtime } from '@/features/notifications/socket/useNotificationRealtime'
import { isInvoicePrintRoute } from '@/routes/invoicePrintRoutes'

const AIAssistantWidget = lazy(() =>
  import('@/components/ai/AIAssistantWidget').then((m) => ({
    default: m.AIAssistantWidget,
  })),
)

function App() {
  const dispatch = useAppDispatch() // Typed dispatch function to send actions
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const userId = useAppSelector((state) => state.auth.user?.id ?? null)
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const isCheckoutPreparingUi = useAppSelector((state) => state.checkout.isPreparingUi)
  const [isHomeScreenReady, setIsHomeScreenReady] = useState(false)
  const handleHomeScreenReady = useCallback((ready: boolean) => {
    if (ready) setIsHomeScreenReady(true)
  }, [])
  useNotificationRealtime({ userId, accessToken })
  const isDashboardRoute =
    pathname === '/seller' ||
    pathname.startsWith('/seller/') ||
    pathname === '/super-admin' ||
    pathname.startsWith('/super-admin/') ||
    pathname === '/warehouse-manager' ||
    pathname.startsWith('/warehouse-manager/') ||
    pathname === '/delivery-agent' ||
    pathname.startsWith('/delivery-agent/') ||
    pathname === '/warehouse' ||
    pathname.startsWith('/warehouse/') ||
    pathname === '/delivery' ||
    pathname.startsWith('/delivery/') ||
    pathname === '/employee' ||
    pathname.startsWith('/employee/')
  
  const isInvoicePrintRoutePath = isInvoicePrintRoute(pathname)
  const hideGlobalChrome = isDashboardRoute || isInvoicePrintRoutePath

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
   * Invoice and receipt print routes are exempt: they are rendered by the
   * headless PDF renderer, which has no session, and authorisation comes from
   * server-verified print tokens rather than the auth store. Waiting for the
   * auth bootstrap there would stall PDF rendering.
   */
  const isHome = Boolean(matchPath({ path: '/', end: true }, pathname))
  // Only hold the splash until above-the-fold home data is ready — do not wait
  // for every below-the-fold image (that made refresh feel long vs sites like unit.com.au).
  const showSplash =
    !isInvoicePrintRoutePath &&
    !isDashboardRoute &&
    isHome &&
    !isHomeScreenReady

  useEffect(() => {
    if (!showSplash) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showSplash])

  return (
    <HomeScreenReadyProvider onReadyChange={handleHomeScreenReady}>
      <div
        className={
          isDashboardRoute
            ? 'min-h-screen bg-slate-50'
            : 'flex min-h-screen flex-col bg-[#f5f5f5]'
        }
      >
        {!hideGlobalChrome && <Navbar />}

        <ScrollToTop />
        <GoogleAnalytics />

        {/* Dashboard routes skip storefront chrome; main wrapper stays for home loading. */}
        <main
          className={isDashboardRoute || isInvoicePrintRoutePath ? 'min-h-screen' : 'flex-1'}
        >
          <div inert={showSplash || undefined}>
            <AppRoutes />
          </div>
        </main>

        {!hideGlobalChrome && !showSplash && !isCheckoutPreparingUi && <Footer />}

        {showSplash && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#f5f5f5]">
            <SpinPage />
          </div>
        )}

        {!showSplash && !isDashboardRoute && !isCheckoutPreparingUi && (
          <Suspense fallback={null}>
            <AIAssistantWidget />
          </Suspense>
        )}
      </div>
    </HomeScreenReadyProvider>
  )
}

export default App
