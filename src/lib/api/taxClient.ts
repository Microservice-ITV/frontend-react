import axios from 'axios'
import { TAX_SERVICE_BASE_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'

export const taxClient = axios.create({
    baseURL: TAX_SERVICE_BASE_URL,
})

setupAuthInterceptors(taxClient)
