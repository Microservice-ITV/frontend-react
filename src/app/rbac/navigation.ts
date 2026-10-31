import type { AppRole } from './types'

export const getDefaultLandingPathByRole = (role: AppRole): string => {
  if (role === 'SUPER_ADMIN' || role === 'HR_MANAGER') return '/super-admin'
  if (role === 'WAREHOUSE_MANAGER') return '/warehouse-manager'
  if (role === 'DELIVERY_AGENT') return '/delivery-agent/overview'
  if (role === 'SHOP_OWNER' || role === 'SHOP_ADMIN') return '/seller'
  if (role === 'PAYROLL_OFFICER' || role === 'PAYROLL_APPROVER' || role === 'FINANCE') {
    return '/payroll'
  }
  if (role === 'FINANCE_MANAGER') return '/seller/finance'
  return '/'
}

const NEVER_REDIRECT_PATHS = new Set(['/login', '/register', '/forbidden', '/oauth-success', '/oauth-error'])

const DISALLOWED_PREFIXES_BY_ROLE: Record<AppRole, string[]> = {
  SUPER_ADMIN: [],
  HR_MANAGER: [],
  PAYROLL_OFFICER: ['/seller', '/super-admin', '/warehouse-manager', '/delivery-agent'],
  PAYROLL_APPROVER: ['/seller', '/super-admin', '/warehouse-manager', '/delivery-agent'],
  FINANCE: ['/seller', '/super-admin', '/warehouse-manager', '/delivery-agent'],
  WAREHOUSE_MANAGER: ['/seller', '/super-admin', '/delivery-agent'],
  DELIVERY_AGENT: ['/seller', '/super-admin', '/warehouse-manager'],
  SHOP_OWNER: ['/super-admin', '/warehouse-manager', '/delivery-agent'],
  SHOP_ADMIN: ['/super-admin', '/warehouse-manager', '/delivery-agent'],
  SHOP_SUPERVISOR: ['/super-admin', '/warehouse-manager', '/delivery-agent'],
  CASHIER: ['/super-admin', '/warehouse-manager', '/delivery-agent', '/seller'],
  EMPLOYEE: ['/seller', '/super-admin', '/warehouse-manager', '/delivery-agent'],
  FINANCE_MANAGER: ['/super-admin', '/warehouse-manager', '/delivery-agent'],
  USER: ['/seller', '/super-admin', '/warehouse-manager', '/delivery-agent'],
}

/** Platform staff stay inside their dashboard unless the request is already there. */
const DASHBOARD_ONLY_PREFIX_BY_ROLE: Partial<Record<AppRole, string>> = {
  WAREHOUSE_MANAGER: '/warehouse-manager',
  DELIVERY_AGENT: '/delivery-agent',
}

const startsWithPrefix = (path: string, prefix: string) =>
  path === prefix || path.startsWith(`${prefix}/`)

const isPathAllowedForRole = (role: AppRole, rawPath: string): boolean => {
  const blockedPrefixes = DISALLOWED_PREFIXES_BY_ROLE[role] ?? []
  if (blockedPrefixes.some((prefix) => startsWithPrefix(rawPath, prefix))) {
    return false
  }

  const dashboardOnlyPrefix = DASHBOARD_ONLY_PREFIX_BY_ROLE[role]
  if (dashboardOnlyPrefix && !startsWithPrefix(rawPath, dashboardOnlyPrefix)) {
    return false
  }

  return true
}

export const resolvePostLoginPath = (
  role: AppRole,
  requestedPath?: string,
  roles?: readonly AppRole[],
): string => {
  const fallbackPath = getDefaultLandingPathByRole(role)
  const rawPath = requestedPath?.trim()

  if (!rawPath || !rawPath.startsWith('/')) {
    return fallbackPath
  }

  if (NEVER_REDIRECT_PATHS.has(rawPath)) {
    return fallbackPath
  }

  if (role === 'FINANCE_MANAGER') {
    const financePaths = [
      '/seller/finance',
      '/seller/finance/transactions',
      '/seller/finance/ar-ap',
      '/seller/accounting/receivables-payables',
      '/seller/accounting/inventory-valuation',
    ]
    return financePaths.some((path) => startsWithPrefix(rawPath, path))
      ? rawPath
      : fallbackPath
  }

  const candidateRoles = roles && roles.length > 0 ? roles : [role]
  if (candidateRoles.some((candidate) => isPathAllowedForRole(candidate, rawPath))) {
    return rawPath
  }

  const blockedPrefixes = DISALLOWED_PREFIXES_BY_ROLE[role]
  if (blockedPrefixes.some((prefix) => startsWithPrefix(rawPath, prefix))) {
    return fallbackPath
  }

  return fallbackPath
}
