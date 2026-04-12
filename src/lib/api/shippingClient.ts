import axios from 'axios'
import { SHIPPING_SERVICE_BASE_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'

export const shippingClient = axios.create({
    baseURL: SHIPPING_SERVICE_BASE_URL,
})

setupAuthInterceptors(shippingClient)