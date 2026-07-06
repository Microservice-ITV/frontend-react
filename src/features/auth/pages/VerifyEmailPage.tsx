import { useState, useEffect } from 'react'
import { AlertCircle, Mail } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { verifyEmail, resendVerification } from '@/features/auth/store/authThunks'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const VerifyEmailPage = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const location = useLocation()

    const { status, error, requiresVerification } = useAppSelector((s) => s.auth)

    const searchParams = new URLSearchParams(location.search)
    const email = searchParams.get('email') || ''

    const [otp, setOtp] = useState('')
    const [resendTimer, setResendTimer] = useState(0)
    const [resendMessage, setResendMessage] = useState('')
    const [resending, setResending] = useState(false)

    const isLoading = status === 'loading'

    useEffect(() => {
        if (!email && !requiresVerification) {
            navigate('/register', { replace: true })
        }
    }, [email, requiresVerification, navigate])

    useEffect(() => {
        if (resendTimer <= 0) return
        const id = setInterval(() => setResendTimer((t) => t - 1), 1000)
        return () => clearInterval(id)
    }, [resendTimer])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otp.length !== 6 || isLoading) return

        try {
            await dispatch(verifyEmail({ token: otp })).unwrap()
            navigate('/login', { replace: true })
        } catch {
            setOtp('')
        }
    }

    const handleResend = async () => {
        if (resending || resendTimer > 0 || !email) return
        setResending(true)
        setResendMessage('')
        try {
            await dispatch(resendVerification({ email })).unwrap()
            setResendTimer(60)
            setResendMessage('Code resent!')
        } catch (err: unknown) {
            setResendMessage(typeof err === 'string' ? err : 'Failed to resend code')
        } finally {
            setResending(false)
        }
    }

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
        setOtp(value)
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 pt-8 pb-12 flex flex-col items-center">
            <Card className="w-full max-w-md p-8">
                <Mail className="mx-auto h-10 w-10 text-gray-400" />

                <h1 className="mt-4 text-2xl font-semibold text-gray-900 text-center">
                    Verify your email
                </h1>

                <p className="mt-2 text-sm text-gray-600 text-center">
                    Enter the 6-digit code sent to <strong className="text-gray-900">{email}</strong>
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

                <form onSubmit={handleVerify} className="mt-6 space-y-4">
                    <Input
                        label="Verification Code"
                        placeholder="000000"
                        value={otp}
                        onChange={handleOtpChange}
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoFocus
                        required
                    />

                    <Button
                        type="submit"
                        loading={isLoading}
                        disabled={otp.length !== 6 || isLoading}
                    >
                        Verify Email
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    {resendMessage && (
                        <p
                            className={`text-xs mb-2 ${
                                resendMessage === 'Code resent!'
                                    ? 'text-green-600'
                                    : 'text-red-600'
                            }`}
                        >
                            {resendMessage}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending || resendTimer > 0}
                        className="text-sm font-medium text-black hover:underline disabled:text-gray-400 disabled:no-underline"
                    >
                        {resendTimer > 0
                            ? `Resend code in ${resendTimer}s`
                            : "Didn't receive the code? Resend"}
                    </button>
                </div>
            </Card>
        </div>
    )
}
