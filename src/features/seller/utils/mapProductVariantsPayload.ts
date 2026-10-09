import type { ProductDetailReadItem, SellerProductVariantPayload } from '@/features/seller/api/sellerProductApi'
import { defaultVariantRow, type ProductFormValues } from '@/features/seller/components/ProductForm'
import {
  computeProfitThresholdPercent,
  parseOptionalPercent,
  sellingPriceFromStoredSale,
} from '@/utils/variantPricing'

const parseOptionalDimension = (value: string) =>
  value.trim() === '' ? null : Number(value)

const toFiniteNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || String(value).trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const textOrEmpty = (value: unknown) =>
  value != null && String(value).trim() !== '' ? String(value) : ''

export function mapProductFormToVariantsPayload(
  values: ProductFormValues,
): SellerProductVariantPayload[] {
  return values.variants.map((v, i) => {
    const basePrice = Number(v.basePrice)
    const listPrice = Number(v.listPrice)

    return {
      ...(v.serverVariantId ? { id: v.serverVariantId } : {}),
      colorId: v.colorId,
      sizeId: v.sizeId,
      basePrice,
      listPrice,
      // The form collects selling/list price, not a markup input. Derive the
      // percentage expected by Product Service from those two values.
      profitThresholdPercent:
        Number.isFinite(basePrice) && basePrice > 0 && Number.isFinite(listPrice)
          ? computeProfitThresholdPercent(basePrice, listPrice)
          : 0,
      discountPercent: parseOptionalPercent(v.discountPercent),
      stock: Number(v.stock),
      length: parseOptionalDimension(v.length),
      width: parseOptionalDimension(v.width),
      height: parseOptionalDimension(v.height),
      weight: parseOptionalDimension(v.weight),
      isPrimary: i === values.primaryVariantIndex,
    }
  })
}

export function mapApiProductVariantsToFormShape(
  item: ProductDetailReadItem,
): Pick<ProductFormValues, 'variants' | 'primaryVariantIndex'> {
  const raw = Array.isArray(item.variants) ? item.variants : []
  if (raw.length === 0) {
    return { variants: [defaultVariantRow()], primaryVariantIndex: 0 }
  }
  const variants: ProductFormValues['variants'] = raw.map((v) => {
    const id = v.id ?? v.variantId ?? ''
    const basePrice = toFiniteNumber(v.basePrice)
    const discountPercent = toFiniteNumber(v.discountPercent) ?? 0
    const resolvedListPrice =
      sellingPriceFromStoredSale(
        toFiniteNumber(v.effectiveSellingPrice) ?? toFiniteNumber(v.price),
        discountPercent,
      ) ??
      toFiniteNumber(v.listPrice) ??
      toFiniteNumber(v.sellingPrice) ??
      basePrice

    return {
      serverVariantId: typeof id === 'string' && id.length > 0 ? id : undefined,
      colorId: v.colorId ?? '',
      sizeId: v.sizeId ?? '',
      basePrice: basePrice !== undefined ? String(basePrice) : '',
      listPrice: resolvedListPrice !== undefined ? String(resolvedListPrice) : '',
      discountPercent: toFiniteNumber(v.discountPercent) !== undefined ? String(discountPercent) : '0',
      stock: textOrEmpty(v.stock) || textOrEmpty(v.shopStock),
      length: textOrEmpty(v.length),
      width: textOrEmpty(v.width),
      height: textOrEmpty(v.height),
      weight: textOrEmpty(v.weight),
    }
  })

  const primaryIdx = raw.findIndex((v) => v.isPrimary)
  return {
    variants,
    primaryVariantIndex: primaryIdx >= 0 ? primaryIdx : 0,
  }
}
