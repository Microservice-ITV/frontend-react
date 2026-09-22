import { authClient } from '@/lib/api/authClient'
import axios from 'axios'

export type RbacPermissionDto = {
  id: string
  code: string
  module: string
  action: string
}

export type RbacRoleDto = {
  id: string
  code: string
  name: string
  scope: string
  is_system: boolean
  created_at?: string | null
  permissions: RbacPermissionDto[]
}

type RbacRolesApiResponse = {
  success: boolean
  data: {
    roles: RbacRoleDto[]
  }
}

type RbacPermissionsApiResponse = {
  success: boolean
  data: {
    permissions: RbacPermissionDto[]
  }
}

/** Optional lookup filters for the shared role list endpoint. */
export type RbacRoleListParams = {
  /** Restrict to one role scope (e.g. `shop` when picking a shop membership role). */
  scope?: 'platform' | 'shop' | 'self'
  /** Partial match on role name or code. */
  search?: string
}

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

export const adminRbacApi = {
  listRoles(params: RbacRoleListParams = {}): Promise<{ data: RbacRolesApiResponse }> {
    // Strip empty values so they don't clutter the query string.
    const clean: Record<string, string> = {}
    if (params.scope) clean.scope = params.scope
    if (params.search?.trim()) clean.search = params.search.trim()
    return authClient.get('/rbac/roles', { params: clean })
  },

  listPermissions(): Promise<{ data: RbacPermissionsApiResponse }> {
    return authClient.get('/rbac/permissions')
  },

  updateRolePermissions(
    roleId: string,
    permissionCodes: string[],
  ): Promise<{ data: { success: boolean; data: { role: RbacRoleDto } } }> {
    return authClient.patch(`/rbac/roles/${roleId}/permissions`, { permissions: permissionCodes })
  },

  getApiErrorMessage,
}