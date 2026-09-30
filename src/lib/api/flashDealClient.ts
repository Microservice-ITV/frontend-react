import { ecommerceReadRestClient } from './ecommerceReadRestClient'
import { productServiceAssetUrl } from './apiConfig'
import { PROMOTION_SERVICE_BASE_URL } from './apiConfig'

export interface FlashDealTimeSlot {
  time: string
  label: string
  isActive: boolean
  dealCount: number
}

export interface FlashDealApiItem {
  id: string
  flashDealId: string
  flashDealName: string
  name: string
  image: string
  tag: string
  dealPrice: number
  originalPrice: number
  discount: number
  sold: string
  stockText: string
  stockProgress: number
  remainingQuantity: number
  soldOut: boolean
  productId: string
  productSlug: string
  slot: string
  allocatedQuantity: number
  purchaseLimit: number
  startAt: string
  endAt: string
  categoryId: string
  categorySlug: string
}

export interface FlashDealApiResponse {
  success: boolean
  data?: any
  error?: string
}

export interface FlashDealTimeSlotResponse {
  items: FlashDealApiItem[]
  timeSlots: FlashDealTimeSlot[]
  serverTime: string
}

/** Storefront: Get flash deals by time slot (read-only, unchanged) */
export const getFlashDealsByTimeSlot = (params?: {
  limit?: number
  slotTime?: string
  categoryId?: string
  status?: string
}) =>
  ecommerceReadRestClient.get<FlashDealTimeSlotResponse>(
    '/catalog/flash-deals/time-slots',
    { params },
  ).then((res) => ({
    ...res,
    data: {
      ...res.data,
      items: (res.data.items ?? []).map((item) => ({
        ...item,
        image: item.image ? productServiceAssetUrl(item.image) : item.image,
      })),
    },
  }))

type Envelope<T> = {
  success: boolean
  data: T
  error?: string
}

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
    throw new Error(body.error || body.message || `Request failed with status ${res.status}`)
  }
  const body = (await res.json()) as Envelope<T>
  if (body.success === false) {
    throw new Error(body.error || 'Request failed')
  }
  return body.data
}

const flashDealUrl = (path: string): string =>
  `${PROMOTION_SERVICE_BASE_URL}/promotions/flash-deals${path}`

/** Admin: Create flash deal (routes to promotion-service port 5007) */
export const adminCreateFlashDeal = (body: {
  name: string
  description?: string
  status?: string
  startAt: string
  endAt: string
  items: Array<{
    productId: string
    variantId?: string
    originalPrice: number
    dealPrice: number
    allocatedQuantity: number
    purchaseLimit: number
    sortOrder?: number
  }>
}) =>
  request(flashDealUrl(''), {
    method: 'POST',
    body: JSON.stringify(body),
  })

/** Admin: List flash deals (routes to promotion-service port 5007) */
export const adminListFlashDeals = (params?: {
  page?: number
  limit?: number
  status?: string
  startAfter?: string
  endBefore?: string
}) => {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.status) query.set('status', params.status)
  if (params?.startAfter) query.set('startAfter', params.startAfter)
  if (params?.endBefore) query.set('endBefore', params.endBefore)
  const queryString = query.toString()
  return request(flashDealUrl(`?${queryString}`))
}

/** Admin: Get flash deal by ID (routes to promotion-service port 5007) */
export const adminGetFlashDeal = (id: string) =>
  request(flashDealUrl(`/${id}`))

/** Admin: Update flash deal (routes to promotion-service port 5007) */
export const adminUpdateFlashDeal = (id: string, body: {
  name?: string
  description?: string
  status?: string
  startAt?: string
  endAt?: string
  items?: Array<{
    itemId?: string
    productId: string
    variantId?: string
    originalPrice?: number
    dealPrice?: number
    allocatedQuantity: number
    purchaseLimit: number
    sortOrder?: number
  }>
}) =>
  request(flashDealUrl(`/${id}`), {
    method: 'PATCH',
    body: JSON.stringify(body),
  })

/** Admin: Publish flash deal (routes to promotion-service port 5007) */
export const adminPublishFlashDeal = (id: string) =>
  request(flashDealUrl(`/${id}/publish`), { method: 'POST' })

/** Admin: Update flash deal stock (routes to promotion-service port 5007) */
export const adminUpdateFlashDealStock = (id: string, items: {
  itemId: string
  allocatedQuantity: number
}[]) =>
  request(flashDealUrl(`/${id}/stock`), {
    method: 'PATCH',
    body: JSON.stringify({ items }),
  })

/** Admin: Delete flash deal (routes to promotion-service port 5007) */
export const adminDeleteFlashDeal = (id: string) =>
  request(flashDealUrl(`/${id}`), { method: 'DELETE' })