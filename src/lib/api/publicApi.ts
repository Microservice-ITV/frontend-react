import axios from 'axios'
import { PRODUCT_SERVICE_BASE_URL } from './apiConfig'

export const publicApi = axios.create({
    baseURL: PRODUCT_SERVICE_BASE_URL,
})