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
  async receiptStatus(orderId: string): Promise<Array<{
    id: string
    tracking_number: string | null
    buyer_confirmed_at: string | null
  }>> {
    return (await deliveryClient.get(`/deliveries/receipt-status/${encodeURIComponent(orderId)}`)).data.data
  },
  async confirmReceipt(deliveryId: string): Promise<{
    id: string
    order_id: string
    status: string
    delivered_at?: string | null
    confirmed_by: string
    buyer_confirmed_at: string
  }> {
    const response = await deliveryClient.post(`/deliveries/${deliveryId}/confirm-receipt`)
    return response.data
  },
}
