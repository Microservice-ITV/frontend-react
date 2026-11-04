import { useQuery } from '@tanstack/react-query'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { categoryApi } from '@/features/categories/api/categoryApi'
import type { Category } from '@/features/categories/types/categoryTypes'
import { homeQueryKeys } from './homeQueryKeys'

const CATEGORIES_STALE_MS = 10 * 60_000

export async function fetchHomeCategories(): Promise<Category[]> {
  const response = await categoryApi.getAll()
  const payload = response.data
  const list = payload.data ?? payload.items ?? []
  return list.map((c) => ({
    ...c,
    image: c.image ? productServiceAssetUrl(c.image) : c.image,
    _count: c._count,
  }))
}

export function useHomeCategoriesQuery() {
  return useQuery({
    queryKey: homeQueryKeys.categories(),
    queryFn: fetchHomeCategories,
    staleTime: CATEGORIES_STALE_MS,
  })
}
