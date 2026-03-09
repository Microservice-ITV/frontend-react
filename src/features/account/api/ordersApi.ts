import { ecommerceReadClient } from '@/lib/api/ecommerceReadClient'
import type { PurchasedOrder } from '../types/orderTypes'

const MY_ORDERS_QUERY = `
  query MyOrders {
    myOrders {
      orderId
      status
      createdAt
      placedAt
      items {
        productId
        sku
        slug
        name
        description
        imageUrl
        quantity
        unitPrice
        lineTotal
        currency
      }
      totals {
        subtotal
        total
        currency
      }
      payment {
        status
        transactionId
        failedReason
      }
      fulfillment {
        status
        deliveries {
          deliveryId
          status
          trackingNumber
          trackingUrl
          estimatedDeliveryDate
        }
      }
    }
  }
`

type GraphQLError = { message?: string }

interface MyOrdersResponse {
  data?: {
    myOrders?: PurchasedOrder[]
  }
  errors?: GraphQLError[]
}

export const ordersApi = {
  async myOrders(): Promise<PurchasedOrder[]> {
    const response = await ecommerceReadClient.post<MyOrdersResponse>('', {
      query: MY_ORDERS_QUERY,
    })

    if (response.data.errors?.length) {
      const message = response.data.errors[0]?.message ?? 'Failed to fetch orders'
      throw new Error(message)
    }

    return response.data.data?.myOrders ?? []
  },
}
