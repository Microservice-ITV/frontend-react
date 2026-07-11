import axios from 'axios'
import { AUTH_SERVICE_BASE_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'

// This file was previously named authApi and is now renamed to clarify
// that it represents a low-level HTTP client (transport layer).

export const authClient = axios.create({
  baseURL: AUTH_SERVICE_BASE_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
  },
})

setupAuthInterceptors(authClient, {
  skipAuthForPaths: ['/login', '/register', '/refresh', '/logout'],
  enableRefreshRetry: true,
})