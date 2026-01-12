import axios from 'axios'
import { store } from '@/app/store'
import { refreshAccessToken, logout } from '@/features/auth/authThunks'

export const api = axios.create({
    baseURL: 'https://localhost:3000/api',
    withCredentials: true, // refresh token via httpOnly cookie
})

/* =========================
   REQUEST INTERCEPTOR
   ========================= */
api.interceptors.request.use(
    (config) => {
        const token = store.getState().auth.accessToken

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => Promise.reject(error)
)

/* =========================
   RESPONSE INTERCEPTOR
   ========================= */
let isRefreshing = false
let failedQueue: {
    resolve: (value?: unknown) => void
    reject: (reason?: any) => void
}[] = []

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((promise) => {
        error ? promise.reject(error) : promise.resolve(token)
    })
    failedQueue = []
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(() => api(originalRequest))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                await store.dispatch(refreshAccessToken()).unwrap()
                processQueue(null)
                return api(originalRequest)
            } catch (err) {
                processQueue(err, null)
                store.dispatch(logout())
                return Promise.reject(err)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

// // Interceptor Flow Example:
// LoginPage.tsx
//  ↓ dispatch(login)
// authThunks.ts
//  ↓ authService.login()
// api.ts
//  ↓ interceptor adds token
//  ↓ backend response
//  ↓ redux state updated
// UI re-renders automatically

// // On token expiry:
// Any API call
//  ↓ 401
// api interceptor
//  ↓ refreshToken()
//  ↓ retry request
//  ↓ success (user never notices)