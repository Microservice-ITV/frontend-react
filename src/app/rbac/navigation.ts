import type { AppRole } from './types'

export const getDefaultLandingPathByRole = (role: AppRole): string => {
  if (role === 'SUPER_ADMIN') return '/super-admin'
  if (role === 'WAREHOUSE_MANAGER') return '/warehouse-manager'
  if (role === 'SHOP_OWNER' || role === 'SHOP_ADMIN') return '/seller'
  return '/'
}

const NEVER_REDIRECT_PATHS = new Set(['/login', '/register', '/forbidden', '/oauth-success', '/oauth-error'])

const DISALLOWED_PREFIXES_BY_ROLE: Record<AppRole, string[]> = {
  SUPER_ADMIN: [],
  WAREHOUSE_MANAGER: ['/seller', '/super-admin'],
  SHOP_OWNER: ['/super-admin', '/warehouse-manager'],
  SHOP_ADMIN: ['/super-admin', '/warehouse-manager'],
  USER: ['/seller', '/super-admin', '/warehouse-manager'],
}

const startsWithPrefix = (path: string, prefix: string) =>
  path === prefix || path.startsWith(`${prefix}/`)

export const resolvePostLoginPath = (role: AppRole, requestedPath?: string): string => {
  const fallbackPath = getDefaultLandingPathByRole(role)
  const rawPath = requestedPath?.trim()

  if (!rawPath || !rawPath.startsWith('/')) {
    return fallbackPath
  }

  if (NEVER_REDIRECT_PATHS.has(rawPath)) {
    return fallbackPath
  }

  const blockedPrefixes = DISALLOWED_PREFIXES_BY_ROLE[role]
  if (blockedPrefixes.some((prefix) => startsWithPrefix(rawPath, prefix))) {
    return fallbackPath
  }

  return rawPath
}