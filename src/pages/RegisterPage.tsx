import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { register } from '@/features/auth/authThunks'
import { getRecaptchaToken } from '@/utils/recaptcha'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const RegisterPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const { status, error } = useAppSelector((s) => s.auth)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const isLoading = status === 'loading'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Get reCAPTCHA token
    const recaptchaToken = await getRecaptchaToken('register')

    dispatch(
      register({
        ...form,
        recaptchaToken,
      })
    )
  }

  // ✅ Redirect to login after successful registration
  useEffect(() => {
    if (status === 'succeeded') {
      navigate('/login', { replace: true })
    }
  }, [status, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8">
        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          Create an account
        </h1>

        <p className="mt-2 text-sm text-gray-600 text-center">
          Join us and start shopping today
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Name"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />

          {/* Error */}
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

          {/* Button (same as Navbar color) */}
          <Button
            type="submit"
            loading={isLoading}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            Create Account
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-black hover:underline"
          >
            Login
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