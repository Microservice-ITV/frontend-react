import { useState } from 'react'
import { AlertCircle, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { forgotPassword } from '@/features/auth/store/authThunks'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const ForgotPasswordPage = () => {
  const dispatch = useAppDispatch()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const isFormValid = email.trim() !== '' && email.includes('@')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid || loading) return

    setLoading(true)
    setError(null)

    try {
      await dispatch(forgotPassword({ email: email.trim() })).unwrap()
      setSent(true)
    } catch (err: unknown) {
      setError(typeof err === 'string' ? err : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-8 pb-12 flex flex-col items-center">
      <Card className="w-full max-w-md p-8">
        <Mail className="mx-auto h-10 w-10 text-gray-400" />

        <h1 className="mt-4 text-2xl font-semibold text-gray-900 text-center">
          Forgot your password?
        </h1>

        <p className="mt-2 text-sm text-gray-600 text-center">
          {sent
            ? 'We sent a password reset code. Check your inbox.'
            : 'Enter your email and we will send you a password reset code.'}
        </p>

        {error && (
          <div
            className="mt-4 flex items-start gap-2 rounded-sm border border-red-200 bg-[#fff6f6] px-3 py-2 text-xs text-red-700"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="mt-[1px] h-4 w-4 shrink-0 text-red-500" aria-hidden />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {sent ? (
          <p className="mt-6 text-center text-sm text-gray-700">
            Use the code from the email to reset your password. If you can't find it, check your
            spam folder.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" loading={loading} disabled={!isFormValid || loading}>
              Send reset code
            </Button>
          </form>
        )}
      </Card>

      <p className="mt-6 text-sm text-center text-gray-600">
        <Link to="/login" className="font-medium text-black hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  )
}