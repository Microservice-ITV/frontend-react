import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchMe, login } from '@/features/auth/store/authThunks'
import { setLoginDraft } from '@/features/auth/store/authSlice'
import { getRecaptchaToken } from '@/utils/recaptcha'
import { extractRoleFromUser } from '@/app/rbac/normalizers'
import { getDefaultLandingPathByRole } from '@/app/rbac/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import SocialAuthSection from '../components/SocialAuthSection'

export const LoginPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const { status, isAuthenticated, user, error, loginDraft } = useAppSelector((s) => s.auth)

  const [email, setEmail] = useState(loginDraft.email)
  const [password, setPassword] = useState(loginDraft.password)

  const isLoading = status === 'loading'
  const isFormValid = email.trim() !== '' && password.trim() !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Get reCAPTCHA token
    const recaptchaToken = await getRecaptchaToken('login')

    try {
      await dispatch(login({ email, password, recaptchaToken })).unwrap()
      await dispatch(fetchMe()).unwrap()
    } catch (err) {
      // login failed → do NOT fetchMe
    }
  }

  // Keep login draft in Redux so values survive remounts (but reset on full reload).
  useEffect(() => {
    dispatch(setLoginDraft({ email, password }))
  }, [dispatch, email, password])

  // Redirect after login success
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = extractRoleFromUser(user)
      const nextPath = from !== '/' ? from : getDefaultLandingPathByRole(role)
      navigate(nextPath, { replace: true })
    }
  }, [isAuthenticated, user, from, navigate])

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-8 pb-12 flex flex-col items-center">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-gray-600 text-center">
          Please enter your credentials to login
        </p>

        {/* Error message */}
        {error && (
          <div
            className="mt-4 flex items-start gap-2 rounded-sm border border-red-200 bg-[#fff6f6] px-3 py-2 text-xs text-red-700"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="mt-[1px] h-4 w-4 shrink-0 text-red-500" aria-hidden />
            <p className="flex-1">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isLoading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* reCAPTCHA Notice */}
          <div className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-blue-600 text-lg">🛡️</div>
            <div className="text-xs text-gray-600">
              <p className="font-semibold text-gray-700">
                Protected by Google reCAPTCHA
              </p>
              <p>We use reCAPTCHA to prevent spam and abuse.</p>
            </div>
          </div>

          <Button
            type="submit"
            loading={isLoading}
            disabled={!isFormValid || isLoading}
          >
            Login
          </Button>

          {/* Social Login */}
          <SocialAuthSection />
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-black hover:underline">
            Sign up
          </Link>
        </p>

        {/* Legal */}
        <p className="mt-4 text-[10px] text-center text-gray-400">
          This site is protected by reCAPTCHA and the Google
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            className="underline mx-1"
          >
            Privacy Policy
          </a>
          and
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            className="underline ml-1"
          >
            Terms of Service
          </a>
          apply.
        </p>
      </Card>
    </div>
  )
}