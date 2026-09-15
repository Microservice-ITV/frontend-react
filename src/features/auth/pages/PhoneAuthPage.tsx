import { useState } from 'react'
import { ArrowLeft, Phone, ShieldCheck } from 'lucide-react'
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
      const fullPhone = normalizedPhone
      const recaptchaToken = await getRecaptchaToken('phone_otp_request')
      await dispatch(requestPhoneOtp({ phone: fullPhone, recaptchaToken })).unwrap()

      navigate(`/phone-verify?phone=${encodeURIComponent(fullPhone)}`)
    } catch {
      // The auth slice exposes the server error beside this form.
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <Link
          to="/login"
          className="
            mb-6
            inline-flex
            w-fit
            items-center
            gap-2
            text-sm
            font-medium
            text-gray-500
            transition-colors
            hover:text-gray-900
          "
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <Card className="w-full overflow-hidden p-0 shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50 px-6 pb-8 pt-8 sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black shadow-lg">
              <Phone className="h-6 w-6 text-white" strokeWidth={2.2} />
            </div>

            <h1 className="mt-5 text-center text-2xl font-semibold tracking-tight text-gray-900">
              Continue with phone
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-gray-500">
              Enter your phone number and we&apos;ll send you a verification code.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 px-6 py-8 sm:px-8"
          >
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Phone number
              </label>

              <div
                className="
                  flex
                  overflow-hidden
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  shadow-sm
                  transition-all
                  focus-within:border-gray-400
                  focus-within:ring-4
                  focus-within:ring-gray-100
                "
              >
                {/* Country */}
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    border-r
                    border-gray-200
                    bg-gray-50
                    px-4
                    text-sm
                    font-semibold
                    text-gray-700
                  "
                >
                  <span className="text-base">🇲🇲</span>
                  <span>{COUNTRY_CODE}</span>
                </div>

                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="9*********"
                  value={phone}
                  maxLength={10}
                  onChange={(e) => {
                    const value = e.target.value
                    if (/^\d*$/.test(value)) {
                      setPhone(value)
                    }
                  }}
                  className="
                    min-w-0
                    flex-1
                    border-0
                    bg-transparent
                    px-4
                    py-3.5
                    text-sm
                    font-medium
                    text-gray-900
                    outline-none
                    placeholder:text-gray-400
                  "
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-gray-400">
                Example: 9*********
              </p>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              disabled={!isValid || isLoading}
            >
              Continue
            </Button>

            {error && (
              <p className="text-sm text-red-600" role="alert">{error}</p>
            )}

            {/* Security */}
            <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                <ShieldCheck className="h-4 w-4 text-gray-700" />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700">
                  Secure verification
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Your phone number is used only to verify your identity and
                  secure your account.
                </p>
              </div>
            </div>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-gray-500">
          By continuing, you agree to our{' '}
          <a href="/terms" className="font-medium text-gray-800 hover:underline">
            Terms
          </a>{' '}
          and{' '}
          <a
            href="/privacy"
            className="font-medium text-gray-800 hover:underline"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
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