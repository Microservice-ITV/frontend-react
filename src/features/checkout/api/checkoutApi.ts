import { bundleApi } from '@/features/bundles/api/bundleApi'
import { orderClient } from '@/lib/api/orderClient'
import { productClient } from '@/lib/api/productClient'
import type { AxiosResponse } from 'axios'
import type { CheckoutResponse, CheckoutStatusResponse } from '../types/checkoutTypes'
import { promotionClient } from '@/lib/api/promotionClient'

export type CheckoutShopShippingPayload = {
  shop_id: string
  shipping_fee: number
}

export type CheckoutAddressPayload = {
  full_name: string
  phone_no: string
  email?: string | null
  country_code: string
  country: string
  state: string
  city: string
  district: string
  ward: string
  address_line_1: string
  address_line_2?: string | null
  postal_code?: string | null
  latitude?: number | null
  longitude?: number | null
  delivery_note?: string | null
  /** Aggregate shipping from calculate API (`totalShippingFee`) or checkout totals */
  shipping_total: number
  /** Per-shop fees from calculate API, aligned with cart shops */
  shop_shippings: CheckoutShopShippingPayload[]
  /** Optional one-time voucher / promo code */
  promo_code?: string | null
  payment_method?: 'prepaid' | 'cod'
}

export type PromoCodeStatus =
  | 'VALID'
  | 'INVALID'
  | 'EXPIRED'
  | 'USED'
  | 'DISABLED'
  | 'RESERVED'
  | 'LIMIT_REACHED'
  | 'NOT_APPLICABLE'

export type PromotionQuoteResponse = {
  discount_total: number
  final_total: number
  promotion_ids: string[]
  allocations?: Array<Record<string, unknown>>
  promo_code?: string | null
  promo_code_status?: PromoCodeStatus | null
  promo_code_message?: string | null
  bundle_savings?: Array<{
    bundle_id: string
    title: string
    kind: 'FIXED' | 'CART_UPSELL'
    amount: number
    sets: number
  }>
}

export type TaxPreviewResponse = {
  tax_enabled: boolean
  tax_amount: number
  taxable_amount: number
  reason?: string | null
    lines?: Array<{
    line_id?: string
    product_id?: string | null
    variant_id?: string | null
    category_id?: string | null
    tax_rate?: number | null
    tax_amount?: number
    reason?: string | null
  }>
}

async function includeCoveredBundles(
  quote: PromotionQuoteResponse,
  items: Array<{ product_id: string; shop_id: string; unit_price: number; quantity: number }>,
): Promise<PromotionQuoteResponse> {
  if (!items.length) return quote
  try {
    const match = await bundleApi.match(items.map((item) => ({ ...item, selected: true })))
    const known = new Set((quote.bundle_savings ?? []).map((row) => row.bundle_id))
    let room = Math.max(0, Number(quote.final_total) || 0)
    const extra = (match.offers ?? []).flatMap((offer) => {
      const covered = offer.items.length > 0 && offer.items.every((item) => item.in_cart)
      const amount = Math.min(room, Math.max(0, offer.savings ?? 0))
      if (!covered || amount <= 0 || known.has(offer.bundle_id)) return []
      room = Math.round((room - amount) * 100) / 100
      known.add(offer.bundle_id)
      return [{
        bundle_id: offer.bundle_id,
        title: offer.title,
        kind: 'FIXED' as const,
        shop_id: offer.shop_id,
        amount,
        sets: 1,
      }]
    })
    if (!extra.length) return quote
    const added = extra.reduce((sum, row) => sum + row.amount, 0)
    return {
      ...quote,
      discount_total: Math.round((Number(quote.discount_total) + added) * 100) / 100,
      final_total: room,
      promotion_ids: [...new Set([...(quote.promotion_ids ?? []), ...extra.map((row) => row.bundle_id)])],
      bundle_savings: [
        ...(quote.bundle_savings ?? []),
        ...extra.map((row) => ({
          bundle_id: row.bundle_id,
          title: row.title,
          kind: row.kind,
          amount: row.amount,
          sets: row.sets,
        })),
      ],
      allocations: [
        ...(quote.allocations ?? []),
        ...extra.map((row) => ({
          promotion_id: row.bundle_id,
          promotion_name: row.title,
          reward_id: row.bundle_id,
          shop_id: row.shop_id,
          discount_type: 'ITEM',
          funded_by: 'SELLER',
          amount: row.amount,
          source: 'BUNDLE',
        })),
      ],
    }
  } catch {
    return quote
  }
}

export const checkoutApi = {
  async quotePromotions(payload: {
    checkout_id: string
    user_id: string
    items: Array<{
      product_id: string
      shop_id: string
      unit_price: number
      quantity: number
    }>
    subtotal: number
    shipping_total: number
    promo_code?: string | null
  }): Promise<PromotionQuoteResponse> {
    const body = {
      ...payload,
      promo_code: payload.promo_code?.trim()
        ? payload.promo_code.trim().toUpperCase()
        : undefined,
    }
    const response = await promotionClient.post('/promotions/quote', body)
    return includeCoveredBundles(response.data, body.items)
  },

  async previewTax(
    checkoutId: string,
    payload: {
      discount_total: number
      allocations?: Array<Record<string, unknown>>
      category_by_product?: Record<string, string>
    },
  ): Promise<TaxPreviewResponse> {
    const response = await orderClient.post<TaxPreviewResponse>(
      `/saga/orders/checkout/${checkoutId}/tax-preview`,
      payload,
    )
    return response.data
  },

  async quoteTaxLines(items: Array<{
    line_id: string
    category_id: string
    amount: number
  }>): Promise<TaxPreviewResponse> {
    const response = await orderClient.post<TaxPreviewResponse>('/saga/orders/tax-quote', { items })
    return response.data
  },

  async updatePaymentMethod(checkoutId: string, paymentMethod: 'prepaid' | 'cod') {
    const response = await orderClient.put(`/saga/orders/checkout/${checkoutId}/payment-method`, {
      payment_method: paymentMethod,
    })
    return response.data
  },

  createCheckoutSession(data: {
    user_id: string
    items: { product_id: string; qty: number; variant_id?: string }[]
    idempotency_key: string
    delivery_address?: any
  }): Promise<AxiosResponse<CheckoutResponse>> {
    return orderClient.post<CheckoutResponse>('/saga/orders/checkout', data, {
      headers: {
        'Idempotency-Key': data.idempotency_key,
      },
    })
  },

  completeCheckoutSession(checkoutId: string, paymentData?: any): Promise<AxiosResponse<any>> {
    return orderClient.post(`/saga/orders/${checkoutId}/complete`, { payment_data: paymentData })
  },

  getSagaStatus(sagaId: string): Promise<AxiosResponse<any>> {
    return orderClient.get(`/saga/sagas/${sagaId}`)
  },

  getSagaStatistics(): Promise<AxiosResponse<any>> {
    return orderClient.get('/saga/sagas/statistics')
  },

  updateCheckoutAddress(
    checkoutId: string,
    payload: CheckoutAddressPayload,
  ): Promise<AxiosResponse<{
    checkout_id?: string
    message?: string
    address_updated_at?: string
    grand_total?: number
    shipping_total?: number
    promotion_discount_total?: number
    tax_amount?: number
    taxable_amount?: number
    tax_enabled?: boolean
    promo_code?: string | null
    promo_code_status?: PromoCodeStatus | null
    promo_code_message?: string | null
    payment?: { client_secret?: string }
    already_succeeded?: boolean
  }>> {
    return orderClient.put(`/orders/checkout/${checkoutId}/address`, payload)
  },

  async getCheckoutSession(checkoutId: string): Promise<AxiosResponse<CheckoutStatusResponse>> {
    try {
      const res = await orderClient.get<CheckoutStatusResponse | { data: CheckoutStatusResponse }>(
        `/orders/checkout-sessions/${checkoutId}`,
      )
      const raw = res.data as CheckoutStatusResponse | { data: CheckoutStatusResponse }
      const normalized: CheckoutStatusResponse = 'data' in raw ? raw.data : raw
      return { ...res, data: normalized }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        try {
          const res = await orderClient.get<CheckoutStatusResponse | { data: CheckoutStatusResponse }>(
            `/orders/checkout/${checkoutId}/status`,
          )
          const raw = res.data as CheckoutStatusResponse | { data: CheckoutStatusResponse }
          const normalized: CheckoutStatusResponse = 'data' in raw ? raw.data : raw
          return { ...res, data: normalized }
        } catch (innerError: any) {
          if (innerError?.response?.status === 404) {
            const res = await orderClient.get<
              CheckoutStatusResponse | { data: CheckoutStatusResponse }
            >(`/checkouts/${checkoutId}/status`)
            const raw = res.data as CheckoutStatusResponse | { data: CheckoutStatusResponse }
            const normalized: CheckoutStatusResponse = 'data' in raw ? raw.data : raw
            return { ...res, data: normalized }
          }
          throw innerError
        }
      }
      throw error
    }
  },
}

export type CheckoutLineTax = {
  productId: string
  variantId: string
  taxRate: number | null
  taxAmount: number
  noCategoryTax?: boolean
}

export function lineTaxesFromQuote(
  quote: TaxPreviewResponse,
  items: Array<{ productId: string; variantId?: string }>,
): CheckoutLineTax[] {
  const lines = quote.lines ?? []
  return items.map((item) => {
    const variantId = item.variantId ?? ''
    const line = lines.find((candidate) => {
      const lineVariant = candidate.variant_id ?? ''
      if (candidate.product_id && candidate.product_id === item.productId && lineVariant === variantId) {
        return true
      }
      return candidate.line_id === item.productId && variantId === ''
    })
    const rate = line?.tax_rate
    return {
      productId: item.productId,
      variantId,
      taxRate: rate == null || !Number.isFinite(Number(rate)) ? null : Number(rate),
      taxAmount: Number(line?.tax_amount ?? 0),
      noCategoryTax: line?.reason === 'NO_TAX_FOR_CATEGORY',
    }
  })
}

export type CartTaxLine = {
  productId: string
  categoryId?: string
  price: number
  quantity: number
}

/** Quote tax from product categories. Shipping is not included. */
export async function resolveCartTax(
  items: CartTaxLine[],
  discountTotal = 0,
): Promise<{
  taxAmount: number
  categoryByProduct: Record<string, string>
  quote: TaxPreviewResponse
}> {
  const merchandise = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const lines = []
  const categoryByProduct: Record<string, string> = {}

  for (const item of items) {
    let categoryId = item.categoryId?.trim() ?? ''
    if (!categoryId) {
      try {
        const response = await productClient.get<{
          success?: boolean
          data?: { categoryId?: string }
        }>(`/products/${item.productId}`)
        categoryId = response.data.data?.categoryId?.trim() ?? ''
      } catch {
        categoryId = ''
      }
    }

    if (categoryId) categoryByProduct[item.productId] = categoryId

    const lineTotal = item.price * item.quantity
    const share = merchandise > 0 ? (lineTotal / merchandise) * discountTotal : 0
    lines.push({
      line_id: item.productId,
      category_id: categoryId,
      amount: Math.max(0, Math.round((lineTotal - share) * 100) / 100),
    })
  }

  const quote = await checkoutApi.quoteTaxLines(lines)
  return {
    taxAmount: Number(quote.tax_amount ?? 0),
    categoryByProduct,
    quote,
  }
}

export async function quoteTaxForCartItems(
  items: CartTaxLine[],
  discountTotal = 0,
): Promise<number> {
  const quote = await resolveCartTax(items, discountTotal)
  return quote.taxAmount
}

export function isTaxChargeEnabled(quote: {
  tax_enabled?: boolean
  reason?: string | null
}): boolean {
  return quote.tax_enabled !== false && quote.reason !== 'TAX_DISABLED'
}

export function taxRatesFromQuote(quote: {
  tax_enabled?: boolean
  reason?: string | null
  lines?: Array<{ tax_rate?: number | null; reason?: string | null }>
}): number[] {
  if (!isTaxChargeEnabled(quote)) return []
  const rates = new Set<number>()
  for (const line of quote.lines ?? []) {
    if (line.reason) continue
    const rate = Number(line.tax_rate)
    if (!Number.isFinite(rate) || rate <= 0) continue
    rates.add(Math.round(rate * 100) / 100)
  }
  return [...rates].sort((left, right) => left - right)
}

export function formatTaxRateLabel(rates: number[]): string {
  if (rates.length === 0) return ''
  return rates
    .map((rate) => `${Number.isInteger(rate) ? rate : rate}%`)
    .join(', ')
}

/** Same cent rounding as order-service tax quotes. */
export function taxChargeForAmount(amount: number, ratePercent: number | null): number | null {
  if (ratePercent == null || !Number.isFinite(Number(ratePercent))) return null
  const baseCents = Math.max(0, Math.round(amount * 100))
  if (baseCents <= 0 || ratePercent <= 0) return 0
  return Math.round((baseCents * ratePercent) / 100) / 100
}

/** Tax for the current cart using rates already quoted. Null until every line has a rate. */
export function cartTaxFromKnownRates(
  items: Array<{ productId: string; variantId?: string; price: number; quantity: number }>,
  taxes: Array<{ productId: string; variantId: string; taxRate: number | null }>,
  discountTotal = 0,
): number | null {
  if (items.length === 0) return null
  const merchandise = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  let totalCents = 0
  for (const item of items) {
    const variantId = item.variantId ?? ''
    const tax = taxes.find((row) => row.productId === item.productId && row.variantId === variantId)
    if (!tax || tax.taxRate == null) return null
    const lineTotal = item.price * item.quantity
    const share = merchandise > 0 ? (lineTotal / merchandise) * discountTotal : 0
    const base = Math.max(0, Math.round((lineTotal - share) * 100) / 100)
    const charge = taxChargeForAmount(base, tax.taxRate)
    if (charge == null) return null
    totalCents += Math.round(charge * 100)
  }
  return totalCents / 100
}

export function formatDisabledTaxAmount(amount: number): string {
  const value = Number(amount) || 0
  return `Ks ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
