import { useLocation } from 'react-router-dom'

export type FlashDealArea = 'superAdmin' | 'seller'

const AREA_PREFIXES: Record<FlashDealArea, string> = {
  superAdmin: '/super-admin',
  seller: '/seller',
}

const AREA_LIST_PATHS: Record<FlashDealArea, string> = {
  superAdmin: '/super-admin/promotion-engine/flash-deals',
  seller: '/seller/promotion-engine/flash-deals',
}

export const resolveFlashDealArea = (pathname: string): FlashDealArea =>
  pathname === '/seller' || pathname.startsWith('/seller/') ? 'seller' : 'superAdmin'

export const flashDealPathsForArea = (area: FlashDealArea) => {
  const prefix = AREA_PREFIXES[area]
  const list = AREA_LIST_PATHS[area]

  return {
    area,
    prefix,
    overview: `${prefix}/overview`,
    promotionEngine: `${prefix}/promotion-engine`,
    list,
    new: `${list}/new`,
    edit: (id: string) => `${list}/${id}/edit`,
  }
}

/**
 * Flash deal screens are reachable from both the super admin and the seller
 * dashboard, so every link, breadcrumb and post-submit redirect has to stay
 * inside the area the user is currently browsing instead of hardcoding
 * /super-admin and bouncing sellers into a 403.
 */
export const useFlashDealPaths = () => {
  const { pathname } = useLocation()
  return flashDealPathsForArea(resolveFlashDealArea(pathname))
}
