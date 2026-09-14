import { useState } from 'react'
import { AlertCircle, KeyRound } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { resetPassword } from '@/features/auth/store/authThunks'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const ResetPasswordPage = () => {
  const dispatch = useAppDispatch()
  const location = useLocation()

  const searchParams = new URLSearchParams(location.search)
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const hasToken = token.length > 0
  const passwordsMatch = password === passwordConfirmation
  const isFormValid =
    password.length >= 8 && passwordConfirmation.length >= 8 && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid || loading) return

    setLoading(true)
    setError(null)

    try {
      await dispatch(
        resetPassword({ token, password, passwordConfirmation })
      ).unwrap()
      setDone(true)
    } catch (err: unknown) {
      setError(typeof err === 'string' ? err : 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-8 pb-12 flex flex-col items-center">
      <Card className="w-full max-w-md p-8">
        <KeyRound className="mx-auto h-10 w-10 text-gray-400" />

        <h1 className="mt-4 text-2xl font-semibold text-gray-900 text-center">
          Reset your password
        </h1>

        <p className="mt-2 text-sm text-gray-600 text-center">
          {done
            ? 'Your password has been updated.'
            : hasToken
              ? 'Choose a new password for your account.'
              : 'This reset link is invalid or missing.'}
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

        {!hasToken ? (
          <p className="mt-6 text-center text-sm text-gray-700">
            Please request a new password reset code from the{' '}
            <Link to="/forgot-password" className="font-medium text-black hover:underline">
              forgot password
            </Link>{' '}
            page.
          </p>
        ) : !done ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">Must be at least 8 characters</p>

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
            />

            {passwordConfirmation.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-600">Passwords do not match.</p>
            )}

            <Button type="submit" loading={loading} disabled={!isFormValid || loading}>
              Reset password
            </Button>
          </form>
        ) : (
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-block w-full rounded bg-emerald-600 py-2 text-center text-white transition hover:bg-gray-800"
            >
              Back to login
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}