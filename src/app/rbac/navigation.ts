import type { AppRole } from './types'

export const getDefaultLandingPathByRole = (role: AppRole): string => {
  if (role === 'SUPER_ADMIN') return '/super-admin'
  if (role === 'WAREHOUSE_MANAGER') return '/warehouse-manager'
  if (role === 'DELIVERY_AGENT') return '/delivery-agent/overview'
  if (role === 'SHOP_OWNER' || role === 'SHOP_ADMIN') return '/seller'
  return '/'
}

const NEVER_REDIRECT_PATHS = new Set(['/login', '/register', '/forbidden', '/oauth-success', '/oauth-error'])

const DISALLOWED_PREFIXES_BY_ROLE: Record<AppRole, string[]> = {
  SUPER_ADMIN: [],
  WAREHOUSE_MANAGER: ['/seller', '/super-admin', '/delivery-agent'],
  DELIVERY_AGENT: ['/seller', '/super-admin', '/warehouse-manager'],
  SHOP_OWNER: ['/super-admin', '/warehouse-manager', '/delivery-agent'],
  SHOP_ADMIN: ['/super-admin', '/warehouse-manager', '/delivery-agent'],
  USER: ['/seller', '/super-admin', '/warehouse-manager', '/delivery-agent'],
}

/** Platform staff stay inside their dashboard unless the request is already there. */
const DASHBOARD_ONLY_PREFIX_BY_ROLE: Partial<Record<AppRole, string>> = {
  WAREHOUSE_MANAGER: '/warehouse-manager',
  DELIVERY_AGENT: '/delivery-agent',
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

  const dashboardOnlyPrefix = DASHBOARD_ONLY_PREFIX_BY_ROLE[role]
  if (dashboardOnlyPrefix && !startsWithPrefix(rawPath, dashboardOnlyPrefix)) {
    return fallbackPath
  }

  return rawPath
}