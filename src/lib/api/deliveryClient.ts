import axios from 'axios'
import { setupAuthInterceptors } from './setupAuthInterceptors'

export const deliveryClient = axios.create({
  baseURL: import.meta.env.VITE_DELIVERY_SERVICE_URL ?? 'http://localhost:8002/api',
})

setupAuthInterceptors(deliveryClient)

export const deliveryApi = {
  async confirmReceipt(deliveryId: string): Promise<{
    id: string
    order_id: string
    status: string
    delivered_at?: string | null
    confirmed_by: string
  }> {
    const response = await deliveryClient.post(`/deliveries/${deliveryId}/confirm-receipt`)
    return response.data
  },
}
