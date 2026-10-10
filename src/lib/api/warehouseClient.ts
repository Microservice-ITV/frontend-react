import axios from 'axios'
import { WAREHOUSE_SERVICE_BASE_URL } from './apiConfig'
import { setupAuthInterceptors } from './setupAuthInterceptors'

export const warehouseClient = axios.create({
  baseURL: WAREHOUSE_SERVICE_BASE_URL,
})

setupAuthInterceptors(warehouseClient)
