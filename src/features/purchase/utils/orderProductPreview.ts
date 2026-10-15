import { variantDisplayLabel } from '@/features/warehouse/utils/variantLabel'
import type { PurchaseOrder } from '../types/purchaseTypes'

type OrderItem = NonNullable<PurchaseOrder['items']>[number]

/** Color / size label for a PO line, or empty when none. */
export function orderItemVariationLabel(item: OrderItem): string {
  const named = [item.colorName, item.sizeName].filter((part) => part?.trim()).join(' / ')
  if (named) return named
  return variantDisplayLabel(item.variantId, {
    colorName: item.colorName,
    sizeName: item.sizeName,
  })
}

/** Short "Name (variation) × qty, … +N more" preview for table cells. */
export function orderProductPreview(
  items: NonNullable<PurchaseOrder['items']> | undefined,
  limit = 2,
): string | null {
  if (!items?.length) return null
  const preview = items
    .slice(0, limit)
    .map((item) => {
      const name = item.productName?.trim() || 'Product'
      const variation = orderItemVariationLabel(item)
      const label = variation ? `${name} (${variation})` : name
      return `${label} × ${item.quantity}`
    })
    .join(', ')
  const more = items.length > limit ? ` +${items.length - limit} more` : ''
  return `${preview}${more}`
}
