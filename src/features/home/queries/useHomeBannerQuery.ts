import { useQuery } from '@tanstack/react-query'
import { heroBannerApi } from '@/features/heroBanners/api/heroBannerApi'
import type { HeroBanner } from '@/features/heroBanners/types/heroBannerTypes'
import { promoCardApi } from '@/features/promoCards/api/promoCardApi'
import type { PromoCard } from '@/features/promoCards/types/promoCardTypes'
import { homeQueryKeys } from './homeQueryKeys'

const HOME_STALE_MS = 5 * 60_000

export type HomeBannerData = {
  heroBanners: HeroBanner[]
  sideBanners: PromoCard[]
}

export async function fetchHomeBanner(): Promise<HomeBannerData> {
  const [heroRes, promoRes] = await Promise.all([
    heroBannerApi.getAll({ isActive: true }),
    promoCardApi.getAll(),
  ])

  const heroBanners = heroRes.data
    .filter((b) => b.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const sideBanners = promoRes.data
    .filter((p) => p.isActive)
    .sort((a, b) => {
      if (a.position === b.position) return 0
      return a.position === 'TOP' ? -1 : 1
    })

  return { heroBanners, sideBanners }
}

export function useHomeBannerQuery() {
  return useQuery({
    queryKey: homeQueryKeys.banner(),
    queryFn: fetchHomeBanner,
    staleTime: HOME_STALE_MS,
  })
}
