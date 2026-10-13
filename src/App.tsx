import { useCallback, useEffect, useRef, useState } from 'react'
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
import SpinPage from '@/components/spin/SpinPage'
import { HomeScreenReadyProvider } from '@/features/home/homeScreenReady'
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget'
import { useNotificationRealtime } from '@/features/notifications/socket/useNotificationRealtime'

const CONTENT_READY_TIMEOUT_MS = 12000

function App() {
  const dispatch = useAppDispatch() // Typed dispatch function to send actions
  const isAuthBootstrapping = useAppSelector(selectIsAuthBootstrapping)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const userId = useAppSelector((state) => state.auth.user?.id ?? null)
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const [isHomeScreenReady, setIsHomeScreenReady] = useState(false)
  const [contentSettled, setContentSettled] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const handleHomeScreenReady = useCallback((ready: boolean) => {
    if (ready) setIsHomeScreenReady(true)
  }, [])
  useNotificationRealtime({ userId, accessToken })
  const hideGlobalChrome =
    matchPath({ path: '/seller', end: true }, pathname) ||
    matchPath({ path: '/seller/*' }, pathname) ||
    matchPath({ path: '/super-admin', end: true }, pathname) ||
    matchPath({ path: '/super-admin/*' }, pathname) ||
    matchPath({ path: '/warehouse-manager', end: true }, pathname) ||
    matchPath({ path: '/warehouse-manager/*' }, pathname) ||
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
  const isHome = Boolean(matchPath({ path: '/', end: true }, pathname))
  const isDashboardRoute = Boolean(
    matchPath({ path: '/seller', end: true }, pathname) ||
    matchPath({ path: '/seller/*' }, pathname) ||
    matchPath({ path: '/super-admin', end: true }, pathname) ||
    matchPath({ path: '/super-admin/*' }, pathname) ||
    matchPath({ path: '/warehouse-manager', end: true }, pathname) ||
    matchPath({ path: '/warehouse-manager/*' }, pathname),
  )
  const waitForHomeScreen = isHome && !contentSettled
  const showSplash =
    !isInvoicePrintRoute &&
    !isDashboardRoute &&
    (isAuthBootstrapping || waitForHomeScreen)

  useEffect(() => {
    if (!isHome || !isHomeScreenReady || isAuthBootstrapping) return

    const root = mainRef.current
    if (!root) return

    let cancelled = false
    let timeoutId = 0
    let frameId = 0

    const finish = () => {
      if (cancelled) return
      frameId = window.requestAnimationFrame(() => {
        if (!cancelled) setContentSettled(true)
      })
    }

    const images = Array.from(root.querySelectorAll('img'))
    images.forEach((img) => {
      if (img.loading === 'lazy') img.loading = 'eager'
    })

    const pending = images.filter((img) => Boolean(img.currentSrc || img.src) && !img.complete)
    let remaining = pending.length
    const settleOne = () => {
      remaining -= 1
      if (remaining <= 0) finish()
    }

    if (pending.length === 0) {
      finish()
    } else {
      pending.forEach((img) => {
        img.addEventListener('load', settleOne, { once: true })
        img.addEventListener('error', settleOne, { once: true })
      })
      timeoutId = window.setTimeout(finish, CONTENT_READY_TIMEOUT_MS)
    }

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(timeoutId)
      pending.forEach((img) => {
        img.removeEventListener('load', settleOne)
        img.removeEventListener('error', settleOne)
      })
    }
  }, [isAuthBootstrapping, isHome, isHomeScreenReady])

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
      <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
        {!hideGlobalChrome && <Navbar />}

        <ScrollToTop />
        <GoogleAnalytics />

        {/* Main Content stays mounted so sections and images can finish loading. */}
        <main ref={mainRef} className="flex-1">
          <div inert={showSplash}>
            <AppRoutes />
          </div>
        </main>

        {!hideGlobalChrome && !showSplash && <Footer />}

        {showSplash && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#f5f5f5]">
            <SpinPage />
          </div>
        )}

        {!showSplash && !isDashboardRoute && <AIAssistantWidget />}
      </div>
    </HomeScreenReadyProvider>
  )
}

export default App
