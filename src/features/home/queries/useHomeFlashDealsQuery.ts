import { useQuery } from '@tanstack/react-query'
import { getFlashDealsByTimeSlot } from '@/lib/api/flashDealClient'
import {
  FLASH_DEAL_STOREFRONT_REFRESH_MS,
  selectLiveFlashDeals,
} from '@/features/flash-deals/lib/flashDealStorefront'
import { homeQueryKeys } from './homeQueryKeys'

export async function fetchHomeFlashDeals() {
  const res = await getFlashDealsByTimeSlot({ limit: 12, status: 'all' })
  return selectLiveFlashDeals(res.data.items)
}

export function useHomeFlashDealsQuery() {
  return useQuery({
    queryKey: homeQueryKeys.flashDeals(),
    queryFn: fetchHomeFlashDeals,
    staleTime: 0,
    refetchInterval: FLASH_DEAL_STOREFRONT_REFRESH_MS,
    refetchOnWindowFocus: true,
  })
}
