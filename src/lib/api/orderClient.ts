import axios from 'axios'
import { ORDER_SERVICE_BASE_URL } from './apiConfig'
import { store } from '@/app/store'

export const orderClient = axios.create({
  baseURL: ORDER_SERVICE_BASE_URL,
})

orderClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

