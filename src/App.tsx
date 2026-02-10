import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { bootstrapAuth } from '@/features/auth/store/authThunks'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import AppRoutes from '@/routes/AppRoutes'
import HeaderSpacer from './components/layouts/HeaderSpacer'
import { selectAuthStatus } from './features/auth/store/authSelectors'

function App() {
  const dispatch = useAppDispatch() // Typed dispatch function to send actions
  const status = useAppSelector(selectAuthStatus) // Reads auth state from Redux store

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

      {/* Main Content */}
      <main className="flex-1">
        <AppRoutes />
      </main>

      <Footer />
    </div>
  )
}

export default App