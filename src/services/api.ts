import axios, { AxiosRequestConfig } from 'axios'
import { store } from '@/app/store'
import { refreshAccessToken, logout } from '@/features/auth/store/authThunks'

interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
    _retry?: boolean
}

export const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
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

const processQueue = (error: any) => {
    failedQueue.forEach((promise) =>
        error ? promise.reject(error) : promise.resolve(undefined)
    )
    failedQueue = []
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as AxiosRequestConfigWithRetry

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
                processQueue(err)
                store.dispatch(logout())
                return Promise.reject(err)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)