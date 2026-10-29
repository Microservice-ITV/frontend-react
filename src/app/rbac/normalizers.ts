import type { User } from '@/features/auth/types/authTypes'
import type { AppRole } from './types'

const ROLE_ALIASES: Record<string, AppRole> = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PLATFORM_SUPER_ADMIN: 'SUPER_ADMIN',
  PLATFORM_FINANCE: 'SUPER_ADMIN',
  PLATFORM_DIRECTOR: 'SUPER_ADMIN',
  PLATFORM_CFO: 'SUPER_ADMIN',
  CFO: 'SUPER_ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  HR: 'HR_MANAGER',
  PAYROLL_OFFICER: 'PAYROLL_OFFICER',
  PAYROLL: 'PAYROLL_OFFICER',
  PAYROLL_APPROVER: 'PAYROLL_APPROVER',
  FINANCE: 'FINANCE',
  WAREHOUSE_MANAGER: 'WAREHOUSE_MANAGER',
  DELIVERY_AGENT: 'DELIVERY_AGENT',
  SHOP_OWNER: 'SHOP_OWNER',
  SHOP_ADMIN: 'SHOP_ADMIN',
  SELLER: 'SHOP_ADMIN',
  SHOP_SELLER: 'SHOP_ADMIN',
  SHOP_SUPERVISOR: 'SHOP_SUPERVISOR',
  SUPERVISOR: 'SHOP_SUPERVISOR',
  CASHIER: 'CASHIER',
  CASHIERS: 'CASHIER',
  // Staff are shop members for the owner, but login/browse as normal customers.
  // They keep USER surface area plus employee self-service (e.g. My Leave).
  STAFF: 'EMPLOYEE',
  SHOP_STAFF: 'EMPLOYEE',
  EMPLOYEE: 'EMPLOYEE',
  FINANCE_MANAGER: 'SHOP_ADMIN',
  DIRECTOR: 'SHOP_ADMIN',
  USER: 'USER',
  CUSTOMER: 'USER',
}

const normalizeRoleString = (value: string): AppRole | null => {
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_')
  return ROLE_ALIASES[normalized] ?? null
}

export const extractRolesFromUser = (user: User | null): AppRole[] => {
  if (!user) return ['USER']
  const candidates: string[] = []

  if (user.role) candidates.push(user.role)
  if (user.role_name) candidates.push(user.role_name)
  if (user.active_shop_role) candidates.push(user.active_shop_role)

  // Shop staff memberships are excluded from the auth-service "effective role"
  // (they log in as customers), but they are still employees for self-service
  // purposes such as My Leave. Treat staff memberships as the EMPLOYEE role.
  if (Array.isArray(user.staff_shop_ids) && user.staff_shop_ids.length > 0) {
    candidates.push('STAFF')
  }

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
    'HR_MANAGER',
    'PAYROLL_OFFICER',
    'PAYROLL_APPROVER',
    'FINANCE',
    'WAREHOUSE_MANAGER',
    'DELIVERY_AGENT',
    'SHOP_OWNER',
    'SHOP_ADMIN',
    'SHOP_SUPERVISOR',
    'CASHIER',
    'EMPLOYEE',
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
