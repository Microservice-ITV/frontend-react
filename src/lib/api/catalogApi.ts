import axios from 'axios'
import { CATALOG_API_BASE_URL } from './apiConfig'
import { store } from '@/app/store'

export const catalogApi = axios.create({
    baseURL: CATALOG_API_BASE_URL,
})

catalogApi.interceptors.request.use((config) => {
    const token = store.getState().auth.accessToken
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})