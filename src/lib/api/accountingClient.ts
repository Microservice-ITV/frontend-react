import axios from 'axios'
import { ACCOUNTING_SERVICE_BASE_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'

export const accountingClient = axios.create({
  baseURL: ACCOUNTING_SERVICE_BASE_URL,
})

setupAuthInterceptors(accountingClient)
