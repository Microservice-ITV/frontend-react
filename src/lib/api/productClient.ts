import axios from 'axios'
import { PRODUCT_SERVICE_BASE_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'
import { setupRetryOn429 } from './setupRetryOn429'

export const productClient = axios.create({
  baseURL: PRODUCT_SERVICE_BASE_URL,
})

setupAuthInterceptors(productClient)
setupRetryOn429(productClient)
