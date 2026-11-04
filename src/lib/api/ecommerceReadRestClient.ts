import axios from 'axios'
import { ECOMMERCE_READ_SERVICE_BASE_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'
import { setupRetryOn429 } from './setupRetryOn429'

export const ecommerceReadRestClient = axios.create({
  baseURL: ECOMMERCE_READ_SERVICE_BASE_URL,
})

setupAuthInterceptors(ecommerceReadRestClient)
setupRetryOn429(ecommerceReadRestClient)