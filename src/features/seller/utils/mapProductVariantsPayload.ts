import type { ProductDetailReadItem, SellerProductVariantPayload } from '@/features/seller/api/sellerProductApi'
import { defaultVariantRow, type ProductFormValues } from '@/features/seller/components/ProductForm'
import { parseOptionalPercent } from '@/utils/variantPricing'

export function mapProductFormToVariantsPayload(
  values: ProductFormValues,
): SellerProductVariantPayload[] {
  return values.variants.map((v, i) => ({
    ...(v.serverVariantId ? { id: v.serverVariantId } : {}),
    colorId: v.colorId,
    sizeId: v.sizeId,
    basePrice: Number(v.basePrice),
    profitThresholdPercent: parseOptionalPercent(v.profitThresholdPercent),
    discountPercent: parseOptionalPercent(v.discountPercent),
    stock: Number(v.stock),
    isPrimary: i === values.primaryVariantIndex,
  }))
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
      basePrice:
        v.basePrice != null && String(v.basePrice).trim() !== ''
          ? String(v.basePrice)
          : '',
      profitThresholdPercent:
        v.profitThresholdPercent != null && String(v.profitThresholdPercent).trim() !== ''
          ? String(v.profitThresholdPercent)
          : '0',
      discountPercent:
        v.discountPercent != null && String(v.discountPercent).trim() !== ''
          ? String(v.discountPercent)
          : '0',
      stock: resolvedStock,
    }
  })

  const primaryIdx = raw.findIndex((v) => v.isPrimary)
  return {
    variants,
    primaryVariantIndex: primaryIdx >= 0 ? primaryIdx : 0,
  }
}