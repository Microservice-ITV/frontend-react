import type { ProductDetail, ProductVariant } from '@/features/products/types/productTypes'

/** Sellable units for a variant: shop catalog + warehouse inventory. */
export function variantSellableStock(variant: ProductVariant): number {
  return Math.max(0, Number(variant.shopStock ?? 0)) + Math.max(0, Number(variant.warehouseStock ?? 0))
}

/** Sellable units for the active SKU, or product-level total when no variants. */
export function productSellableStock(
  product: ProductDetail,
  selectedVariant: ProductVariant | null,
): number {
  const variants = product.variants ?? []
  const effective =
    selectedVariant ??
    variants.find((v) => v.isPrimary && variantSellableStock(v) > 0) ??
    variants.find((v) => variantSellableStock(v) > 0) ??
    variants[0] ??
    null
  if (effective) return variantSellableStock(effective)
  return Math.max(0, Number(product.stock ?? 0))
}
