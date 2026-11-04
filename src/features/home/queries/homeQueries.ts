import { useQuery } from '@tanstack/react-query'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { getFlashDealsByTimeSlot } from '@/lib/api/flashDealClient'
import { announcementApi } from '@/features/announcements/api/announcementApi'
import { categoryApi } from '@/features/categories/api/categoryApi'
import type { Category } from '@/features/categories/types/categoryTypes'
import { heroBannerApi } from '@/features/heroBanners/api/heroBannerApi'
import type { HeroBanner } from '@/features/heroBanners/types/heroBannerTypes'
import { promoCardApi } from '@/features/promoCards/api/promoCardApi'
import type { PromoCard } from '@/features/promoCards/types/promoCardTypes'
import { productApi } from '@/features/products/api/productApi'
import type { Product } from '@/features/products/types/productTypes'
import { FLASH_DEAL_STOREFRONT_REFRESH_MS, selectLiveFlashDeals } from '@/features/flash-deals/lib/flashDealStorefront'
import { homeApi } from '../api/homeApi'
import type { HomeFeature } from '../store/homeTypes'
import type { TopOrderedProduct } from '../types/topOrderedProductTypes'
import { homeQueryKeys } from './homeQueryKeys'

const HOME_STALE_MS = 5 * 60_000
const CATEGORIES_STALE_MS = 10 * 60_000
const TOP_ORDERED_STALE_MS = 3 * 60_000
const RECENT_STALE_MS = 2 * 60_000

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

export async function fetchHomeQuickActions(): Promise<HomeFeature[]> {
  const response = await homeApi.getQuickActions()
  const list = response.data?.data ?? []
  return list.map((feature) => ({
    ...feature,
    iconUrl: productServiceAssetUrl(feature.iconUrl),
  }))
}

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

export async function fetchHomeFlashDeals() {
  const res = await getFlashDealsByTimeSlot({ limit: 12, status: 'all' })
  return selectLiveFlashDeals(res.data.items)
}

export async function fetchHomeTopOrdered(
  limit = 10,
): Promise<TopOrderedProduct[]> {
  return homeApi.getTopOrderedProducts(limit)
}

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

export async function fetchActiveAnnouncements() {
  const response = await announcementApi.getActive()
  return response.data ?? []
}

export function useHomeBannerQuery() {
  return useQuery({
    queryKey: homeQueryKeys.banner(),
    queryFn: fetchHomeBanner,
    staleTime: HOME_STALE_MS,
  })
}

export function useHomeQuickActionsQuery() {
  return useQuery({
    queryKey: homeQueryKeys.quickActions(),
    queryFn: fetchHomeQuickActions,
    staleTime: HOME_STALE_MS,
  })
}

export function useHomeCategoriesQuery() {
  return useQuery({
    queryKey: homeQueryKeys.categories(),
    queryFn: fetchHomeCategories,
    staleTime: CATEGORIES_STALE_MS,
  })
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

export function useHomeTopOrderedQuery(limit = 10) {
  return useQuery({
    queryKey: homeQueryKeys.topOrdered(limit),
    queryFn: () => fetchHomeTopOrdered(limit),
    staleTime: TOP_ORDERED_STALE_MS,
  })
}

export function useHomeRecentProductsQuery(limit = 10) {
  return useQuery({
    queryKey: homeQueryKeys.recentProducts(limit),
    queryFn: () => fetchHomeRecentProducts(limit),
    staleTime: RECENT_STALE_MS,
  })
}

export function useActiveAnnouncementsQuery() {
  return useQuery({
    queryKey: homeQueryKeys.announcements(),
    queryFn: fetchActiveAnnouncements,
    staleTime: HOME_STALE_MS,
  })
}
