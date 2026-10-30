import axios from 'axios'
import { setupAuthInterceptors } from './setupAuthInterceptors'

export const EMPLOYEE_SERVICE_BASE_URL =
  (import.meta.env.VITE_EMPLOYEE_SERVICE_URL as string | undefined) ??
  'http://localhost:8081/api/v1'

export const employeeClient = axios.create({
  baseURL: EMPLOYEE_SERVICE_BASE_URL,
})

setupAuthInterceptors(employeeClient)
