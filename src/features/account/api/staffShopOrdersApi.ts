import { accountingClient } from '@/lib/api/accountingClient'
import { authClient } from '@/lib/api/authClient'
import { shippingApi } from '@/features/shipping/api/shippingApi'
import {
  readActiveCompanies,
  type CheckoutDeliveryCompany,
} from '@/features/shipping/hooks/useCheckoutDeliveryCompany'
import { ecommerceReadClient } from '@/lib/api/ecommerceReadClient'
import { orderClient } from '@/lib/api/orderClient'

export type StaffShop = { shopId: string; shopName: string }

export type StaffShopOrderStatus = 'to-ship' | 'shipped'

export type StaffShopOrder = {
  orderId: string
  status: string
  wayBillNo?: string | null
  createdAt?: string | null
  placedAt?: string | null
  items: Array<{
    productId: string
    variantId?: string | null
    sku: string
    name: string
    imageUrl: string
    quantity: number
    shopId: string
  }>
  totals: { total: number; currency: string }
  sellerTotals?: { total: number; currency: string } | null
  shopBreakdown?: Array<{
    shopId: string
    status?: string | null
    trackingNumber?: string | null
    courierName?: string | null
    shippedAt?: string | null
  }>
  payment?: { method?: string | null } | null
  deliveryAddress?: {
    recipientName?: string
    recipientPhone?: string
    city?: string
    district?: string
    ward?: string
    addressLine1?: string
    addressLine2?: string
    deliveryNote?: string
  } | null
}

const STAFF_SHOP_ORDERS_QUERY = `
  query StaffShopOrders($shopId: ID!, $statusFilter: String) {
    staffShopOrders(shopId: $shopId, statusFilter: $statusFilter) {
      orderId
      status
      wayBillNo
      createdAt
      placedAt
      items { productId variantId sku name imageUrl quantity shopId }
      totals { total currency }
      sellerTotals { total currency }
      shopBreakdown { shopId status trackingNumber courierName shippedAt }
      payment { method }
      deliveryAddress {
        recipientName
        recipientPhone
        city
        district
        ward
        addressLine1
        addressLine2
        deliveryNote
      }
    }
  }
`

type AccessContextResponse = {
  data?: {
    access_context?: {
      shops?: Array<{
        shop_id?: string | null
        shop_name?: string | null
        membership_status?: string | null
        role?: { code?: string | null } | null
      }>
    }
  }
}

export const staffShopOrdersApi = {
  /** Shops where the signed-in user is active staff. */
  async staffShops(): Promise<StaffShop[]> {
    const response = await authClient.get<AccessContextResponse>('/me/access-context')
    return (response.data.data?.access_context?.shops ?? [])
      .filter((shop) =>
        shop.membership_status?.toLowerCase() === 'active'
        && shop.role?.code?.toLowerCase() === 'staff',
      )
      .flatMap((shop) => {
        const shopId = shop.shop_id?.trim()
        return shopId ? [{ shopId, shopName: shop.shop_name?.trim() || shopId }] : []
      })
  },

  async list(shopId: string, statusFilter: StaffShopOrderStatus): Promise<StaffShopOrder[]> {
    const response = await ecommerceReadClient.post<{
      data?: { staffShopOrders?: StaffShopOrder[] }
      errors?: Array<{ message?: string }>
    }>('', { query: STAFF_SHOP_ORDERS_QUERY, variables: { shopId, statusFilter } })

    if (response.data.errors?.length) {
      throw new Error(response.data.errors[0]?.message ?? 'Failed to load shop orders')
    }
    return response.data.data?.staffShopOrders ?? []
  },

  /** Active Delivery Companies configured for the shop (accounting delivery_company_fees). */
  async deliveryCompanies(shopId: string): Promise<CheckoutDeliveryCompany[]> {
    const [configs, catalog] = await Promise.all([
      accountingClient.get<{ configurations?: Array<{ deliveryCompanyId?: string | null }> }>(
        `/delivery-company-configurations/shops/${encodeURIComponent(shopId)}/checkout`,
      ),
      shippingApi.listActiveDeliveryCompanies(),
    ])
    const configured = new Set((configs.data.configurations ?? []).map((row) => row.deliveryCompanyId))
    return readActiveCompanies(catalog.data).filter((company) => configured.has(company.id))
  },

  /** Ships only this shop's portion of the order. */
  async ship(
    orderId: string,
    shopId: string,
    wayBillNo: string,
    deliveryCompanyId: string,
  ): Promise<{ way_bill_no: string; tracking_number?: string }> {
    const response = await orderClient.post(`/orders/${orderId}/create-shipment`, {
      shop_id: shopId,
      way_bill_no: wayBillNo,
      delivery_company_id: deliveryCompanyId || null,
    })
    return response.data
  },
}
