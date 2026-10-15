import { authClient } from '@/lib/api/authClient'
import axios from 'axios'

// ─── DTOs (raw API shapes) ──────────────────────────────────────────────────

export type AdminUserRoleDto = {
  id: string
  code: string
  name: string
  scope: string
}

export type AdminUserDto = {
  id: string
  name: string
  email: string
  email_verified_at: string | null
  created_at: string | null
  /** True when the user belongs to any shop (seller / shop staff). */
  has_shop_membership?: boolean
  roles: AdminUserRoleDto[]
}

// ─── Response envelopes ─────────────────────────────────────────────────────

export type AdminPaginationMeta = {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export type AdminUsersApiResponse = {
  success: boolean
  data: {
    users: AdminUserDto[]
    pagination: AdminPaginationMeta
  }
}

// ─── Shop-role assignment DTOs (Manage Roles) ───────────────────────────────

export type AdminShopLookupDto = {
  id: string
  name: string
  domain: string | null
  status: string
}

export type AdminRoleRefDto = {
  id: string
  code: string
  name: string
  scope: string
}

export type AdminUserShopRoleDto = {
  shop_id: string
  shop: AdminShopLookupDto | null
  role: AdminRoleRefDto | null
  status: string
  joined_at: string | null
}

export type AdminShopLookupApiResponse = {
  success: boolean
  data: {
    shops: AdminShopLookupDto[]
    pagination: AdminPaginationMeta
  }
}

export type AdminUserShopRolesApiResponse = {
  success: boolean
  data: {
    user_id: string
    assignments: AdminUserShopRoleDto[]
  }
}

export type PlatformUserDto = {
  id: string
  user_id: string
  reporting_to: string | null
  joined_at: string | null
  status: string
  user?: { id: string; name: string; email: string } | null
  role?: { id: string; code: string; name: string; scope: string } | null
  manager?: { id: string; user?: { name?: string | null; email?: string | null } | null } | null
}

// ─── Request params ─────────────────────────────────────────────────────────

export type AdminUsersParams = {
  page?: number
  per_page?: number
  search?: string
  role?: string
  verified?: '1' | '0' | ''
}

/** Lookup params for the paginated shop picker. */
export type AdminLookupParams = {
  page?: number
  per_page?: number
  search?: string
}

// ─── Error helper ────────────────────────────────────────────────────────────

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message
    if (typeof msg === 'string' && msg.trim()) return msg
    const validation = error.response?.data?.errors
    if (typeof validation === 'object' && validation !== null) {
      const first = Object.values(validation)[0]
      if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
    }
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/** Drops empty lookup values so they don't clutter the query string. */
const buildLookupParams = (params: AdminLookupParams): Record<string, string | number> => {
  const clean: Record<string, string | number> = {}
  if (params.page) clean.page = params.page
  if (params.per_page) clean.per_page = params.per_page
  if (params.search?.trim()) clean.search = params.search.trim()
  return clean
}

// ─── API surface ─────────────────────────────────────────────────────────────

export const adminUsersApi = {
  listWarehouseManagers(): Promise<{
    data: { success: boolean; data: { users: Array<{ id: string; name: string; email: string }> } }
  }> {
    return authClient.get('/warehouse-managers')
  },

  listUsers(params: AdminUsersParams = {}): Promise<{ data: AdminUsersApiResponse }> {
    // Strip empty strings so they don't clutter the query string
    const clean: Record<string, string | number> = {}
    if (params.page) clean.page = params.page
    if (params.per_page) clean.per_page = params.per_page
    if (params.search?.trim()) clean.search = params.search.trim()
    if (params.role?.trim()) clean.role = params.role.trim()
    if (params.verified === '1' || params.verified === '0') clean.verified = params.verified
    return authClient.get('/admin/users', { params: clean })
  },

  assignPlatformRole(
    userId: string,
    roleCode: string,
  ): Promise<{ data: { success: boolean } }> {
    return authClient.post('/rbac/platform-roles/assign', {
      user_id: userId,
      role_code: roleCode,
    })
  },

  listPlatformUsers(): Promise<{ data: { data: { users: PlatformUserDto[] } } }> {
    return authClient.get('/platform-users')
  },

  updatePlatformReportingTo(platformUserId: string, reportingTo: string | null) {
    return authClient.patch(`/platform-users/${platformUserId}/reporting-to`, { reporting_to: reportingTo })
  },

  // ─ Shop-role assignments (Manage Roles) ───────────────────────────────────

  /** Paginated shop lookup (auth-service shops) for the role assignment picker. */
  listShopLookups(params: AdminLookupParams = {}): Promise<{ data: AdminShopLookupApiResponse }> {
    return authClient.get('/shops', { params: buildLookupParams(params) })
  },

  /** Every shop-role assignment currently held by a user. */
  listUserShopRoles(userId: string): Promise<{ data: AdminUserShopRolesApiResponse }> {
    return authClient.get(`/admin/users/${userId}/shop-roles`)
  },

  /** Assign (or switch) a shop-scoped role for a user inside a shop. */
  assignShopRole(
    shopId: string,
    userId: string,
    roleCode: string,
  ): Promise<{ data: { success: boolean } }> {
    return authClient.post(`/shops/${shopId}/users`, {
      user_id: userId,
      role_code: roleCode,
    })
  },

  getApiErrorMessage,
}
