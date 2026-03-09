import axios from 'axios'
import { ECOMMERCE_READ_GRAPHQL_URL } from './apiConfig'
import { store } from '@/app/store'

export const ecommerceReadClient = axios.create({
  baseURL: ECOMMERCE_READ_GRAPHQL_URL,
})

ecommerceReadClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
