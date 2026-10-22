import type { User } from '@/features/auth/types/authTypes'
import type { AppRole } from './types'

const ROLE_ALIASES: Record<string, AppRole> = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PLATFORM_SUPER_ADMIN: 'SUPER_ADMIN',
  PLATFORM_FINANCE: 'SUPER_ADMIN',
  PLATFORM_DIRECTOR: 'SUPER_ADMIN',
  PLATFORM_CFO: 'SUPER_ADMIN',
  CFO: 'SUPER_ADMIN',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  DELIVERY_AGENT: 'DELIVERY_AGENT',
  SHOP_OWNER: 'SHOP_OWNER',
  SHOP_ADMIN: 'SHOP_ADMIN',
  SELLER: 'SHOP_ADMIN',
  SHOP_SELLER: 'SHOP_ADMIN',
  // Staff are shop members for the owner, but login/browse as normal customers.
  STAFF: 'USER',
  SHOP_STAFF: 'USER',
  FINANCE_MANAGER: 'SHOP_ADMIN',
  DIRECTOR: 'SHOP_ADMIN',
  USER: 'USER',
  CUSTOMER: 'USER',
}

const normalizeRoleString = (value: string): AppRole | null => {
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_')
  return ROLE_ALIASES[normalized] ?? null
}

export const extractRoleFromUser = (user: User | null): AppRole => {
  if (!user) return 'USER'

  const candidates: string[] = []

  if (user.role) candidates.push(user.role)
  if (user.role_name) candidates.push(user.role_name)

  for (const roleEntry of user.roles ?? []) {
    if (typeof roleEntry === 'string') {
      candidates.push(roleEntry)
      continue
    }

    if (roleEntry.code) candidates.push(roleEntry.code)
    if (roleEntry.name) candidates.push(roleEntry.name)
  }

  // Keep a deterministic precedence so privileged roles win if multiple roles exist.
  const precedence: AppRole[] = [
    'SUPER_ADMIN',
    'WAREHOUSE_MANAGER',
    'DELIVERY_AGENT',
    'SHOP_OWNER',
    'SHOP_ADMIN',
    'USER',
  ]

  const resolved = candidates
    .map((candidate) => normalizeRoleString(candidate))
    .filter((role): role is AppRole => role !== null)

  for (const role of precedence) {
    if (resolved.includes(role)) {
      return role
    }
  }

  return 'USER'
}
