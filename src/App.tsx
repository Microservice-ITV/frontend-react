import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { bootstrapAuth, fetchMe } from '@/features/auth/store/authThunks'
import Navbar from '@/components/layouts/navbar/Navbar'
import Footer from '@/components/layouts/Footer'
import AppRoutes from '@/routes/AppRoutes'
import HeaderSpacer from './components/layouts/HeaderSpacer'
import { selectAuthStatus } from './features/auth/store/authSelectors'
import ScrollToTop from './components/routing/ScrollToTop'
import { setAccessToken, setHasSession } from './features/auth/store/authSlice'
import { setSessionCookie } from '@/utils/session'

function App() {
  const dispatch = useAppDispatch() // Typed dispatch function to send actions
  const status = useAppSelector(selectAuthStatus) // Reads auth state from Redux store
  const navigate = useNavigate()

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
        await dispatch(fetchMe()).unwrap()
        navigate('/', { replace: true })
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
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <Navbar />
      <HeaderSpacer />

      <ScrollToTop />

      {/* Main Content */}
      <main className="flex-1">
        <AppRoutes />
      </main>

      <Footer />
    </div>
  )
}

export default App