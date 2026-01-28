import { authApi } from '@/lib/api/authApi'

export const authService = {
  login(data: { email: string; password: string }) {
    return authApi.post('/login', data)
  },

  register(data: { email: string; password: string; name: string }) {
    return authApi.post('/register', data)
  },

  refresh() {
    return authApi.post('/refresh')
  },

  logout() {
    return authApi.post('/logout')
  },

  me() {
    return authApi.get('/me')
  },
}