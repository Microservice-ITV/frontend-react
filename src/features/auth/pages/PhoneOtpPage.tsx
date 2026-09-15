import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquareText,
  RotateCcw,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAppDispatch } from '@/app/hooks'
import { fetchMe, requestPhoneOtp, verifyPhoneOtp } from '../store/authThunks'
import { getRecaptchaToken } from '@/utils/recaptcha'

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

export const PhoneOtpPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()

  const phone = searchParams.get('phone') ?? ''

  const [otp, setOtp] = useState<string[]>(
    Array(OTP_LENGTH).fill('')
  )

  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const [expirySecondsLeft, setExpirySecondsLeft] = useState(300)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const otpValue = useMemo(() => otp.join(''), [otp])

  const isComplete = otpValue.length === OTP_LENGTH

  useEffect(() => {
    if (!phone) {
      navigate('/phone-auth', { replace: true })
    }
  }, [phone, navigate])

  useEffect(() => {
    if (secondsLeft <= 0) return

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [secondsLeft])

  useEffect(() => {
    if (expirySecondsLeft <= 0) return
    const timer = window.setInterval(() => {
      setExpirySecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [expirySecondsLeft])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const updateOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)

    setOtp((current) => {
      const next = [...current]
      next[index] = digit
      return next
    })

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (
    event: React.ClipboardEvent<HTMLInputElement>
  ) => {
    event.preventDefault()

    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)

    if (!pasted) return

    const next = Array(OTP_LENGTH).fill('')

    pasted.split('').forEach((digit, index) => {
      next[index] = digit
    })

    setOtp(next)

    const focusIndex = Math.min(
      pasted.length,
      OTP_LENGTH - 1
    )

    inputRefs.current[focusIndex]?.focus()
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isComplete || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      await dispatch(verifyPhoneOtp({ phone, otp: otpValue })).unwrap()
      await dispatch(fetchMe()).unwrap()
      navigate('/', { replace: true })
    } catch (err) {
      setError(typeof err === 'string' ? err : 'The verification code is invalid or expired.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return

    setIsResending(true)
    setError(null)

    try {
      const recaptchaToken = await getRecaptchaToken('phone_otp_request')
      await dispatch(requestPhoneOtp({ phone, recaptchaToken })).unwrap()

      setSecondsLeft(RESEND_SECONDS)
      setExpirySecondsLeft(300)
      setOtp(Array(OTP_LENGTH).fill(''))

      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(typeof err === 'string' ? err : 'We could not resend the code.')
    } finally {
      setIsResending(false)
    }
  }

  const formattedTimer = `00:${String(secondsLeft).padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <button
          type="button"
          onClick={() => navigate('/phone-auth')}
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
          Change phone number
        </button>

        <Card className="w-full overflow-hidden p-0 shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50 px-6 pb-8 pt-8 sm:px-8">
            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-black
                shadow-lg
              "
            >
              <MessageSquareText
                className="h-6 w-6 text-white"
                strokeWidth={2.2}
              />
            </div>

            <h1 className="mt-5 text-center text-2xl font-semibold tracking-tight text-gray-900">
              Check your SMS
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-gray-500">
              We sent a 6-digit verification code to
            </p>

            <p className="mt-1 text-center text-sm font-semibold text-gray-900">
              {phone}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleVerify}
            className="space-y-7 px-6 py-8 sm:px-8"
          >
            {/* OTP Inputs */}
            <div>
              <div className="flex justify-between gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    onChange={(event) =>
                      updateOtp(index, event.target.value)
                    }
                    onKeyDown={(event) =>
                      handleKeyDown(index, event)
                    }
                    onPaste={handlePaste}
                    className="
                      h-12
                      w-full
                      min-w-0
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      text-center
                      text-lg
                      font-semibold
                      text-gray-900
                      shadow-sm
                      outline-none
                      transition-all
                      focus:border-gray-500
                      focus:ring-4
                      focus:ring-gray-100
                    "
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>

              <p className="mt-4 text-center text-xs text-gray-400">
                The verification code expires shortly for your security.
              </p>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              disabled={!isComplete || isLoading || expirySecondsLeft === 0}
            >
              Verify and continue
            </Button>

            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

            {expirySecondsLeft === 0 && (
              <p className="text-center text-sm text-amber-700">This code has expired. Request a new code.</p>
            )}

            {/* Resend */}
            <div className="border-t border-gray-100 pt-6 text-center">
              {secondsLeft > 0 ? (
                <p className="text-sm text-gray-500">
                  Resend code in{' '}
                  <span className="font-semibold text-gray-900">
                    {formattedTimer}
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    text-sm
                    font-semibold
                    text-gray-900
                    transition-opacity
                    hover:opacity-70
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <RotateCcw className="h-4 w-4" />

                  {isResending
                    ? 'Sending code...'
                    : 'Resend verification code'}
                </button>
              )}
            </div>

            {/* Success hint */}
            <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-700" />

              <p className="text-xs leading-5 text-gray-500">
                Once verified, we&apos;ll securely sign you in or create your
                account automatically.
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}