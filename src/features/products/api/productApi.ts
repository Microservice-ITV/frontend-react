import axios, { AxiosRequestConfig } from 'axios'
import { store } from '@/app/store'
import { refreshAccessToken, logout } from '@/features/auth/store/authThunks'

interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
    _retry?: boolean
}

const CATALOG_BASE_URL =
    import.meta.env.VITE_CATALOG_API_URL ?? 'http://localhost:5001/api/v1'

export const productApi = axios.create({
    baseURL: CATALOG_BASE_URL,
})

// Attach access token (same as auth api)
productApi.interceptors.request.use(
    (config) => {
        const token = store.getState().auth.accessToken

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => Promise.reject(error)
)

// Reuse the same refresh-token flow as auth api
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

productApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as AxiosRequestConfigWithRetry

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(() => productApi(originalRequest))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                await store.dispatch(refreshAccessToken()).unwrap()
                processQueue(null)
                return productApi(originalRequest)
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