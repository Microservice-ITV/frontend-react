import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AlertCircle } from 'lucide-react'
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
    <div className="bg-gray-50 px-4 pt-8 pb-12 flex flex-col items-center">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          Check your SMS
        </h1>

        <p className="mt-2 text-sm text-gray-600 text-center">
          We sent a 6-digit verification code to{' '}
          <span className="font-medium text-gray-900">{phone}</span>
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

        {expirySecondsLeft === 0 && (
          <div
            className="mt-4 flex items-start gap-2 rounded-sm border border-amber-200 bg-[#fffbeb] px-3 py-2 text-xs text-amber-800"
            role="status"
          >
            <p className="flex-1">This code has expired. Request a new code.</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Verification code</label>
            <div className="flex justify-between gap-2.5">
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
                  className="h-12 w-full min-w-0 rounded border text-center text-lg font-semibold outline-none focus:ring focus:ring-blue-300"
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">
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

          <div className="text-center text-sm text-gray-600">
            {secondsLeft > 0 ? (
              <p>
                Resend code in{' '}
                <span className="font-medium text-gray-900">{formattedTimer}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-medium text-black hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResending ? 'Sending code...' : 'Resend verification code'}
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          <button
            type="button"
            onClick={() => navigate('/phone-auth')}
            className="font-medium text-black hover:underline"
          >
            Change phone number
          </button>
        </p>
      </Card>
    </div>
  )
}
