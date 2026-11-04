import { useQuery } from '@tanstack/react-query'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { homeApi } from '../api/homeApi'
import type { HomeFeature } from '../store/homeTypes'
import { homeQueryKeys } from './homeQueryKeys'

const HOME_STALE_MS = 5 * 60_000

export async function fetchHomeQuickActions(): Promise<HomeFeature[]> {
  const response = await homeApi.getQuickActions()
  const list = response.data?.data ?? []
  return list.map((feature) => ({
    ...feature,
    iconUrl: productServiceAssetUrl(feature.iconUrl),
  }))
}

export function useHomeQuickActionsQuery() {
  return useQuery({
    queryKey: homeQueryKeys.quickActions(),
    queryFn: fetchHomeQuickActions,
    staleTime: HOME_STALE_MS,
  })
}
