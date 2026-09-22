import axios from 'axios'
import { PAYMENT_SERVICE_BASE_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'

export const paymentClient = axios.create({
  baseURL: PAYMENT_SERVICE_BASE_URL,
})

setupAuthInterceptors(paymentClient)