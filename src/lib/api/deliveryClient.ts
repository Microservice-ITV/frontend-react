import axios from 'axios'
import { setupAuthInterceptors } from './setupAuthInterceptors'

const defaultDeliveryBaseUrl =
  typeof window !== 'undefined' && window.location.hostname === 'dailyneeditems.com'
    ? 'https://api.dailyneeditems.com/deliveries'
    : 'http://localhost:8002/api'

const deliveryBaseUrl = (
  import.meta.env.VITE_DELIVERY_SERVICE_URL?.trim() || defaultDeliveryBaseUrl
).replace(/\/+$/, '')

export const deliveryClient = axios.create({
  baseURL: deliveryBaseUrl,
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
