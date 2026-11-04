import { useQuery } from '@tanstack/react-query'
import { homeApi } from '../api/homeApi'
import type { TopOrderedProduct } from '../types/topOrderedProductTypes'
import { homeQueryKeys } from './homeQueryKeys'

const TOP_ORDERED_STALE_MS = 3 * 60_000

export async function fetchHomeTopOrdered(
  limit = 10,
): Promise<TopOrderedProduct[]> {
  return homeApi.getTopOrderedProducts(limit)
}

export function useHomeTopOrderedQuery(limit = 10) {
  return useQuery({
    queryKey: homeQueryKeys.topOrdered(limit),
    queryFn: () => fetchHomeTopOrdered(limit),
    staleTime: TOP_ORDERED_STALE_MS,
  })
}
