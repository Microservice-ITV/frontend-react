import { useQuery } from '@tanstack/react-query'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { productApi } from '@/features/products/api/productApi'
import type { Product } from '@/features/products/types/productTypes'
import { homeQueryKeys } from './homeQueryKeys'

const RECENT_STALE_MS = 2 * 60_000

export async function fetchHomeRecentProducts(limit = 10): Promise<{
  items: Product[]
  hasNextPage: boolean
}> {
  const response = await productApi.getRecentProducts(limit)
  const activeItems = response.items.filter((product) => {
    if (product.isActive === false) return false
    return String(product.availabilityStatus ?? '').toUpperCase() !== 'INACTIVE'
  })

  return {
    items: activeItems.map((product) => {
      const stock =
        String(product.availabilityStatus ?? '').toUpperCase() === 'OUT_OF_STOCK'
          ? 0
          : typeof product.totalAvailableStock === 'number'
            ? Math.max(0, product.totalAvailableStock)
            : typeof product.shopAvailableStock === 'number'
              ? Math.max(0, product.shopAvailableStock)
              : typeof product.stock === 'number'
                ? Math.max(0, product.stock)
                : undefined
      return {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        images: product.image
          ? [productServiceAssetUrl(product.image)]
          : (product.images ?? []).map((image) => productServiceAssetUrl(image)),
        categoryId: product.categoryId ?? '',
        tags: product.tags ?? [],
        ...(stock != null ? { stock } : {}),
      }
    }),
    hasNextPage: response.hasNextPage,
  }
}

export function useHomeRecentProductsQuery(limit = 10) {
  return useQuery({
    queryKey: homeQueryKeys.recentProducts(limit),
    queryFn: () => fetchHomeRecentProducts(limit),
    staleTime: RECENT_STALE_MS,
  })
}
