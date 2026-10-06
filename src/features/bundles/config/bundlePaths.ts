import { useLocation } from 'react-router-dom'

export type BundleArea = 'superAdmin' | 'seller'

const prefixes: Record<BundleArea, string> = {
  superAdmin: '/super-admin',
  seller: '/seller',
}

export const resolveBundleArea = (pathname: string): BundleArea =>
  pathname === '/seller' || pathname.startsWith('/seller/') ? 'seller' : 'superAdmin'

export const bundlePathsForArea = (area: BundleArea) => {
  const prefix = prefixes[area]
  const list = `${prefix}/promotion-engine/bundles`
  return {
    area,
    overview: `${prefix}/overview`,
    list,
    new: `${list}/new`,
    edit: (id: string) => `${list}/${id}/edit`,
  }
}

export const useBundlePaths = () => {
  const { pathname } = useLocation()
  return bundlePathsForArea(resolveBundleArea(pathname))
}
