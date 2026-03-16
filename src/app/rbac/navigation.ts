import type { AppRole } from './types'

export const getDefaultLandingPathByRole = (role: AppRole): string => {
  if (role === 'SUPER_ADMIN') return '/super-admin'
  if (role === 'SHOP_OWNER' || role === 'SHOP_ADMIN') return '/seller'
  return '/'
}
