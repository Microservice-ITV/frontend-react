import { authClient } from '@/lib/api/authClient'

export const authFeatureApi = {
  login(data: { email: string; password: string; recaptchaToken: string }) {
    return authClient.post('/login', data)
  },

  register(data: { name: string; email: string; password: string; recaptchaToken: string }) {
    return authClient.post('/register', data)
  },

  requestPhoneOtp(data: { phone: string; recaptchaToken?: string }) {
    return authClient.post('/phone/request-otp', data)
  },

  verifyPhoneOtp(data: { phone: string; otp: string }) {
    return authClient.post('/phone/verify-otp', data)
  },

  refresh() {
    return authClient.post('/refresh')
  },

  me() {
    return authClient.get('/me')
  },

  verifyEmail(token: string) {
    return authClient.post('/verify-email', { token })
  },

  resendVerification(email: string) {
    return authClient.post('/verify-email/resend', { email })
  },
}
