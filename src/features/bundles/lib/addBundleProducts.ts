import type { AppDispatch } from '@/app/store'
import { addToCart } from '@/features/cart/store/cartSlice'
import { productApi } from '@/features/products/api/productApi'
import { productDetailMaxStock } from '@/features/products/components/ProductQuantityInput'
import { pickDefaultVariant, variantDisplayLabel } from '@/features/products/components/ProductVariantSelector'
import { fetchShopProfilesForCurrentCart } from '@/features/shipping/store/shippingThunks'

export async function addBundleProducts(
  dispatch: AppDispatch,
  rows: Array<{ productId: string; quantity: number }>,
) {
  let added = false

  for (const row of rows) {
    try {
      const response = await productApi.getDetail(row.productId)
      const product = response.data.data
      const variant = pickDefaultVariant(product.variants)
      dispatch(addToCart({
        productId: product.id,
        variantId: variant?.variantId ?? '',
        variantLabel: variant ? variantDisplayLabel(variant) : undefined,
        name: product.name,
        price: variant?.price ?? product.price,
        image: product.images?.[0],
        quantity: Math.max(1, row.quantity),
        weightKg: variant?.weight ?? null,
        lengthCm: variant?.length ?? null,
        widthCm: variant?.width ?? null,
        heightCm: variant?.height ?? null,
        shopId: product.shop.id,
        shopName: product.shop.name,
        categoryId: product.categoryId,
        availableStock: productDetailMaxStock(product, variant),
        selected: true,
      }))
      added = true
    } catch {
      // Skip a product that cannot be loaded. The others can still be added.
    }
  }

  if (added) void dispatch(fetchShopProfilesForCurrentCart())
}
