import { api } from './api'

export const authService = {
  login(data: { email: string; password: string }) {
    return api.post('/auth/login', data)
  },

  register(data: { email: string; password: string; name: string }) {
    return api.post('/auth/register', data)
  },

  refresh() {
    return api.post('/auth/refresh')
  },

  logout() {
    return api.post('/auth/logout')
  },
}