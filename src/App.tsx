import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchMe } from '@/features/auth/store/authThunks'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import AppRoutes from '@/routes/AppRoutes'
import HeaderSpacer from './components/layouts/HeaderSpacer'

function App() {
  const dispatch = useAppDispatch() // Typed dispatch function to send actions
  const { accessToken, status } = useAppSelector((state) => state.auth) // Reads auth state from Redux store

  /**
   * Rehydrate auth on app load
   * - If accessToken exists → try /me
   * - If token expired → interceptor refreshes automatically
   * - If refresh fails → user stays logged out
   */
  useEffect(() => {
    if (accessToken) {
      dispatch(fetchMe()) // Fetch user data
    }
  }, [accessToken, dispatch])

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