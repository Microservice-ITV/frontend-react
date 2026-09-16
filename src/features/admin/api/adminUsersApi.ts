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
  roles: AdminUserRoleDto[]
}

// ─── Response envelopes ─────────────────────────────────────────────────────

export type AdminUsersApiResponse = {
  success: boolean
  data: {
    users: AdminUserDto[]
    pagination: {
      total: number
      per_page: number
      current_page: number
      last_page: number
    }
  }
}

// ─── Request params ─────────────────────────────────────────────────────────

export type AdminUsersParams = {
  page?: number
  per_page?: number
  search?: string
  role?: string
  verified?: '1' | '0' | ''
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

// ─── API surface ─────────────────────────────────────────────────────────────

export const adminUsersApi = {
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

  getApiErrorMessage,
}
