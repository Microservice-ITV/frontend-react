import axios from 'axios'
import { ECOMMERCE_READ_SERVICE_BASE_URL } from './apiConfig'
import { store } from '@/app/store'

export const ecommerceReadRestClient = axios.create({
  baseURL: ECOMMERCE_READ_SERVICE_BASE_URL,
})

ecommerceReadRestClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})