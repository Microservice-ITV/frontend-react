import { useEffect, useState } from 'react'
import { productClient } from '@/lib/api/productClient'
import { parseVariantId } from '../utils/variantLabel'

type VariantPricing = {
  id: string
  colorId: string
  sizeId: string
  colorName: string
  sizeName: string
  /** Product selling price (list price, before discount). */
  sellingPrice: number | null
}

type ProductPricingDetail = {
  productPrice: number | null
  variants: VariantPricing[]
}

type ProductDetailResponse = {
  success?: boolean
  data?: {
    id?: string
    price?: number | string | null
    variants?: Array<{
      id?: string
      colorId?: string | null
      sizeId?: string | null
      price?: number | string | null
      listPrice?: number | string | null
      effectiveSellingPrice?: number | string | null
      basePrice?: number | string | null
      color?: { name?: string | null } | null
      size?: { name?: string | null } | null
    }> | null
  } | null
}

export type VariantPricingInfo = {
  /** Product selling price of this variant (before discount). */
  sellingPrice: number | null
  /** Product variant id — needed to save a new selling price. */
  variantId: string | null
  loading: boolean
}

const detailCache = new Map<string, ProductPricingDetail>()
const inflightDetails = new Map<string, Promise<ProductPricingDetail>>()

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const fetchDetail = async (productId: string): Promise<ProductPricingDetail> => {
  const response = await productClient.get<ProductDetailResponse>(
    `/products/${productId}`,
  )
  const data = response.data?.data
  const variants: VariantPricing[] = (data?.variants ?? []).map((variant) => ({
    id: variant.id ?? '',
    colorId: variant.colorId ?? '',
    sizeId: variant.sizeId ?? '',
    colorName: variant.color?.name ?? '',
    sizeName: variant.size?.name ?? '',
    sellingPrice: toNumber(
      variant.listPrice ?? variant.effectiveSellingPrice ?? variant.price,
    ),
  }))

  return {
    productPrice: toNumber(data?.price),
    variants,
  }
}

const loadDetail = async (productId: string): Promise<ProductPricingDetail> => {
  const cached = detailCache.get(productId)
  if (cached) return cached

  const pending = inflightDetails.get(productId)
  if (pending) return pending

  const request = fetchDetail(productId)
    .then((detail) => {
      detailCache.set(productId, detail)
      return detail
    })
    .finally(() => {
      inflightDetails.delete(productId)
    })

  inflightDetails.set(productId, request)
  return request
}

/** Drop the cached product pricing so the next read hits the API. */
export const clearVariantPricingCache = (productId?: string | null) => {
  if (!productId) {
    detailCache.clear()
    return
  }
  detailCache.delete(productId)
}

export type VariantNames = {
  colorName?: string | null
  sizeName?: string | null
}

const sameName = (a?: string | null, b?: string | null) =>
  Boolean(a?.trim()) && a!.trim().toLowerCase() === (b ?? '').trim().toLowerCase()

const matchVariant = (
  detail: ProductPricingDetail,
  variantId?: string | null,
  names?: VariantNames,
): VariantPricing | undefined => {
  const raw = (variantId ?? '').trim()
  const parsed = parseVariantId(raw)

  if (raw && !raw.startsWith('v1::')) {
    // Stock may carry the product-variant uuid directly.
    const byId = detail.variants.find((variant) => variant.id === raw)
    if (byId) return byId
  }
  if (parsed.colorId && parsed.sizeId) {
    const byIds = detail.variants.find(
      (variant) =>
        variant.colorId === parsed.colorId && variant.sizeId === parsed.sizeId,
    )
    if (byIds) return byIds
  }
  // Keys without ids (or legacy blank keys): fall back to color × size names.
  const colorName = names?.colorName || parsed.colorName
  const sizeName = names?.sizeName || parsed.sizeName
  if (colorName && sizeName) {
    const byNames = detail.variants.find(
      (variant) =>
        sameName(variant.colorName, colorName) && sameName(variant.sizeName, sizeName),
    )
    if (byNames) return byNames
  }
  return detail.variants.length === 1 ? detail.variants[0] : undefined
}

const resolvePricing = (
  detail: ProductPricingDetail,
  variantId?: string | null,
  names?: VariantNames,
): VariantPricingInfo => {
  const variant = matchVariant(detail, variantId, names)
  return {
    // Never show another variant's (the primary's) price for an unmatched row.
    sellingPrice: variant
      ? variant.sellingPrice
      : detail.variants.length === 0
        ? detail.productPrice
        : null,
    variantId: variant?.id ?? null,
    loading: false,
  }
}

const EMPTY: VariantPricingInfo = {
  sellingPrice: null,
  variantId: null,
  loading: false,
}

/** Product selling price of one inventory row. */
export const useVariantPricing = (
  productId?: string | null,
  variantId?: string | null,
  names?: VariantNames,
): VariantPricingInfo => {
  const [state, setState] = useState<VariantPricingInfo>(EMPTY)
  const colorName = names?.colorName ?? null
  const sizeName = names?.sizeName ?? null

  useEffect(() => {
    if (!productId) {
      setState(EMPTY)
      return
    }

    let alive = true
    const rowNames = { colorName, sizeName }
    const cached = detailCache.get(productId)
    if (cached) {
      setState(resolvePricing(cached, variantId, rowNames))
      return
    }

    setState((prev) => ({ ...prev, loading: true }))
    void loadDetail(productId)
      .then((detail) => {
        if (!alive) return
        setState(resolvePricing(detail, variantId, rowNames))
      })
      .catch(() => {
        if (!alive) return
        setState(EMPTY)
      })

    return () => {
      alive = false
    }
  }, [productId, variantId, colorName, sizeName])

  return state
}

/** Display helper — mirrors the seller product detail price format. */
export const formatUnitPrice = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—'
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `Ks ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
