import axios from 'axios'
import { ECOMMERCE_READ_SERVICE_BASE_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'

export const ecommerceReadRestClient = axios.create({
  baseURL: ECOMMERCE_READ_SERVICE_BASE_URL,
})

setupAuthInterceptors(ecommerceReadRestClient)