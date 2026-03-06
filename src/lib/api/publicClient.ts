import axios from 'axios'
import { PRODUCT_SERVICE_BASE_URL } from './apiConfig'

export const publicClient = axios.create({
  baseURL: PRODUCT_SERVICE_BASE_URL,
})

