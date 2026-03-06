import axios from 'axios'
import { PRODUCT_SERVICE_BASE_URL } from './apiConfig'
import { store } from '@/app/store'

export const productClient = axios.create({
  baseURL: PRODUCT_SERVICE_BASE_URL,
})

productClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

