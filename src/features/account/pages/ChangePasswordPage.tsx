import { useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAppDispatch } from '@/app/hooks'
import { changePassword } from '@/features/auth/store/authThunks'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const ChangePasswordPage = () => {
  const dispatch = useAppDispatch()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const passwordsMatch = newPassword === newPasswordConfirmation
  const isFormValid =
    currentPassword.trim() !== '' &&
    newPassword.length >= 8 &&
    newPasswordConfirmation.length >= 8 &&
    passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid || loading) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await dispatch(
        changePassword({
          currentPassword,
          newPassword,
          newPasswordConfirmation,
        })
      ).unwrap()
      setSuccess(result.message)
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirmation('')
    } catch (err: unknown) {
      setError(typeof err === 'string' ? err : 'Failed to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-medium text-gray-900 mb-2">Change Password</h1>
      <p className="text-sm text-gray-600 mb-4">
        Choose a new password for your account.
      </p>

      {error && (
        <div
          className="mb-4 flex items-start gap-2 rounded-sm border border-red-200 bg-[#fff6f6] px-3 py-2 text-xs text-red-700"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="mt-[1px] h-4 w-4 shrink-0 text-red-500" aria-hidden />
          <p className="flex-1">{error}</p>
        </div>
      )}

      {success && (
        <div
          className="mb-4 flex items-start gap-2 rounded-sm border border-green-200 bg-[#f6fff6] px-3 py-2 text-xs text-green-700"
          role="status"
        >
          <CheckCircle2 className="mt-[1px] h-4 w-4 shrink-0 text-green-600" aria-hidden />
          <p className="flex-1">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <Input
          label="Current Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={loading}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={loading}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500">Must be at least 8 characters</p>

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={loading}
          value={newPasswordConfirmation}
          onChange={(e) => setNewPasswordConfirmation(e.target.value)}
          required
        />

        {newPasswordConfirmation.length > 0 && !passwordsMatch && (
          <p className="text-xs text-red-600">Passwords do not match.</p>
        )}

        <Button type="submit" loading={loading} disabled={!isFormValid || loading}>
          Change Password
        </Button>
      </form>
    </div>
  )
}

export default ChangePasswordPage