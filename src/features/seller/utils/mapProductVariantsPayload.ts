import type { ProductDetailReadItem, SellerProductVariantPayload } from '@/features/seller/api/sellerProductApi'
import { defaultVariantRow, type ProductFormValues } from '@/features/seller/components/ProductForm'
import {
  computeProfitThresholdPercent,
  parseOptionalPercent,
} from '@/utils/variantPricing'

const parseOptionalDimension = (value: string) =>
  value.trim() === '' ? null : Number(value)

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
    const toFiniteNumber = (value: unknown): number | undefined => {
      if (value === null || value === undefined || String(value).trim() === '') {
        return undefined
      }
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : undefined
    }
    const basePrice = toFiniteNumber(v.basePrice)
    const discountPercent = toFiniteNumber(v.discountPercent) ?? 0
    const directListPrice =
      toFiniteNumber(v.listPrice) ?? toFiniteNumber(v.sellingPrice)
    const effectivePrice =
      toFiniteNumber(v.effectiveSellingPrice) ?? toFiniteNumber(v.price)
    const markupPercent = toFiniteNumber(v.profitThresholdPercent)
    const resolvedListPrice =
      directListPrice ??
      (basePrice !== undefined && markupPercent !== undefined
        ? basePrice * (1 + markupPercent / 100)
        : undefined) ??
      (effectivePrice !== undefined && discountPercent < 100
        ? effectivePrice / (1 - discountPercent / 100)
        : undefined) ??
      basePrice

    // Clean up stock assignment to avoid parser confusion
    let resolvedStock = ''
    if (v.stock != null && String(v.stock).trim() !== '') {
      resolvedStock = String(v.stock)
    } else if (v.shopStock != null && String(v.shopStock).trim() !== '') {
      resolvedStock = String(v.shopStock)
    }

    return {
      serverVariantId: typeof id === 'string' && id.length > 0 ? id : undefined,
      colorId: v.colorId ?? '',
      sizeId: v.sizeId ?? '',
      basePrice: basePrice !== undefined ? String(basePrice) : '',
      listPrice: resolvedListPrice !== undefined ? String(resolvedListPrice) : '',
      discountPercent:
        toFiniteNumber(v.discountPercent) !== undefined
          ? String(discountPercent)
          : '0',
      stock:
        v.stock != null && String(v.stock).trim() !== ''
          ? String(v.stock)
          : v.shopStock != null && String(v.shopStock).trim() !== ''
            ? String(v.shopStock)
            : '',
          length: v.length != null && String(v.length).trim() !== '' ? String(v.length) : '',
          width: v.width != null && String(v.width).trim() !== '' ? String(v.width) : '',
          height: v.height != null && String(v.height).trim() !== '' ? String(v.height) : '',
          weight: v.weight != null && String(v.weight).trim() !== '' ? String(v.weight) : '',
    }
  })

  const primaryIdx = raw.findIndex((v) => v.isPrimary)
  return {
    variants,
    primaryVariantIndex: primaryIdx >= 0 ? primaryIdx : 0,
  }
}
