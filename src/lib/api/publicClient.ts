import axios from 'axios'
import { PRODUCT_SERVICE_BASE_URL } from './apiConfig'
import { setupRetryOn429 } from './setupRetryOn429'

export const publicClient = axios.create({
  baseURL: PRODUCT_SERVICE_BASE_URL,
})

setupRetryOn429(publicClient)

