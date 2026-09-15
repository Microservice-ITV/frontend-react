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
  listRoles(): Promise<{ data: RbacRolesApiResponse }> {
    return authClient.get('/rbac/roles')
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