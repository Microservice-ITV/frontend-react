import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { requestPhoneOtp } from '../store/authThunks'
import { getRecaptchaToken } from '@/utils/recaptcha'

const COUNTRY_CODE = '+95'

export const PhoneAuthPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const error = useAppSelector((state) => state.auth.error)

  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const normalizedPhone = normalizeMyanmarPhone(phone)
  const isValid = /^\+95\d{9,10}$/.test(normalizedPhone)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid || isLoading) return

    setIsLoading(true)

    try {
      const recaptchaToken = await getRecaptchaToken('phone_otp_request')
      await dispatch(requestPhoneOtp({ phone: normalizedPhone, recaptchaToken })).unwrap()
      navigate(`/phone-verify?phone=${encodeURIComponent(normalizedPhone)}`)
    } catch {
      // The auth slice exposes the server error beside this form.
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 px-4 pt-8 pb-12 flex flex-col items-center">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          Continue with phone
        </h1>

        <p className="mt-2 text-sm text-gray-600 text-center">
          Enter your phone number and we'll send you a verification code.
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone number
            </label>
            <div className="flex overflow-hidden rounded border focus-within:ring focus-within:ring-blue-300">
              <div className="flex items-center gap-1.5 border-r bg-gray-50 px-3 py-2.5 text-base font-medium text-gray-700">
                <span aria-hidden>🇲🇲</span>
                <span>{COUNTRY_CODE}</span>
              </div>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="9*********"
                value={phone}
                maxLength={11}
                disabled={isLoading}
                onChange={(e) => {
                  const value = e.target.value
                  if (/^\d*$/.test(value)) {
                    setPhone(value)
                  }
                }}
                required
                className="min-w-0 flex-1 border-0 px-3 py-2.5 text-base outline-none disabled:bg-white disabled:text-gray-400"
              />
            </div>
            <p className="text-xs text-gray-500">Example: 9*********</p>
          </div>

          <div className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-blue-600 text-lg">🛡️</div>
            <div className="text-xs text-gray-600">
              <p className="font-semibold text-gray-700">
                Protected by Google reCAPTCHA
              </p>
              <p>We use reCAPTCHA to prevent spam and abuse.</p>
            </div>
          </div>

          <Button type="submit" loading={isLoading} disabled={!isValid || isLoading}>
            Continue
          </Button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          <Link to="/login" className="font-medium text-black hover:underline">
            Back to login
          </Link>
        </p>

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

function normalizeMyanmarPhone(value: string): string {
  const normalized = value.trim()
  const digits = normalized.replace(/\D/g, '')

  if (normalized.startsWith('+')) return `+${digits}`
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  if (digits.startsWith('0')) return `${COUNTRY_CODE}${digits.slice(1)}`
  if (digits.startsWith('95')) return `+${digits}`

  return `${COUNTRY_CODE}${digits}`
}
