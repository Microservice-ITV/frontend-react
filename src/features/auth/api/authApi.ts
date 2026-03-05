import { authClient } from '@/lib/api/authClient'

export const authFeatureApi = {
  login(data: { email: string; password: string; recaptchaToken: string }) {
    return authClient.post('/login', data)
  },

  register(data: { name: string; email: string; password: string; recaptchaToken: string }) {
    return authClient.post('/register', data)
  },

  refresh() {
    return authClient.post('/refresh')
  },

  me() {
    return authClient.get('/me')
  },
}

