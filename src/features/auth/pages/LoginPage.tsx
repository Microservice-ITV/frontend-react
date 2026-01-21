import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { login } from '@/features/auth/store/authThunks'
import { getRecaptchaToken } from '@/utils/recaptcha'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const LoginPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const { status, isAuthenticated, error } = useAppSelector((s) => s.auth)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const isLoading = status === 'loading'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Get reCAPTCHA token
    const recaptchaToken = await getRecaptchaToken('login')

    dispatch(login({ email, password, recaptchaToken }))
  }

  // Redirect after login success
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          Welcome back
        </h1>

        <p className="mt-2 text-sm text-gray-600 text-center">
          Please enter your credentials to login
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-600 text-center">
              {error}
            </p>
          )}

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

          <Button type="submit" loading={isLoading} className="w-full">
            Login
          </Button>
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