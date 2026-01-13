import { api } from './api'

export const authService = {
  login(data: { email: string; password: string }) {
    return api.post('/login', data)
  },

  register(data: { email: string; password: string; name: string }) {
    return api.post('/register', data)
  },

  refresh() {
    return api.post('/refresh')
  },

  logout() {
    return api.post('/logout')
  },

  me() {
    return api.get('/me')
  },
}