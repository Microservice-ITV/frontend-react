import axios from 'axios'
import { ORDER_SERVICE_BASE_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'

export const orderClient = axios.create({
  baseURL: ORDER_SERVICE_BASE_URL,
})

setupAuthInterceptors(orderClient)
