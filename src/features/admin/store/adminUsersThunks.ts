import { createAsyncThunk } from '@reduxjs/toolkit'
import { adminUsersApi, type AdminUserDto } from '../api/adminUsersApi'
import type { AdminUserRow } from '../types/userTypes'

// ─── Date formatter (shared with other admin thunks) ─────────────────────────

const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── DTO → Row mapper ────────────────────────────────────────────────────────

export const mapAdminUserRoles = (roles: AdminUserDto['roles'] = []): AdminUserRow['roles'] => {
  const unique = new Map<string, AdminUserRow['roles'][number]>()
  for (const role of roles) {
    const roleKey = role.id || role.code || role.name
    const key = [role.scope, roleKey, role.shop_id ?? ''].join(':')
    if (!unique.has(key)) {
      unique.set(key, {
        id: role.id,
        code: role.code,
        name: role.name,
        scope: role.scope,
        shopId: role.shop_id,
        shopName: role.shop_name,
      })
    }
  }
  return [...unique.values()]
}

const mapUserRow = (dto: AdminUserDto): AdminUserRow => ({
  id: dto.id,
  name: dto.name,
  email: dto.email,
  isVerified: dto.email_verified_at !== null && dto.email_verified_at !== undefined,
  roles: mapAdminUserRoles(dto.roles),
  created: formatDate(dto.created_at),
})

// ─── Fetch users (paginated) ─────────────────────────────────────────────────

export type FetchAdminUsersArg = {
  page?: number
  perPage?: number
  search?: string
  role?: string
  verified?: '1' | '0' | ''
}

export type FetchAdminUsersResult = {
  users: AdminUserRow[]
  total: number
  lastPage: number
}

export const fetchAdminUsers = createAsyncThunk<
  FetchAdminUsersResult,
  FetchAdminUsersArg,
  { rejectValue: string }
>('adminUsers/fetchUsers', async (arg, { rejectWithValue }) => {
  try {
    const response = await adminUsersApi.listUsers({
      page: arg.page ?? 1,
      per_page: arg.perPage ?? 20,
      search: arg.search,
      role: arg.role,
      verified: arg.verified,
    })
    const { users, pagination } = response.data.data
    return {
      users: users.map(mapUserRow),
      total: pagination.total,
      lastPage: pagination.last_page,
    }
  } catch (error: unknown) {
    return rejectWithValue(
      adminUsersApi.getApiErrorMessage(error, 'Unable to load users right now. Please try again.'),
    )
  }
})

// ─── Assign platform role ────────────────────────────────────────────────────

export const assignAdminUserRole = createAsyncThunk<
  void,
  { userId: string; roleCode: string },
  { rejectValue: string }
>('adminUsers/assignRole', async ({ userId, roleCode }, { rejectWithValue }) => {
  try {
    await adminUsersApi.assignPlatformRole(userId, roleCode)
  } catch (error: unknown) {
    return rejectWithValue(
      adminUsersApi.getApiErrorMessage(error, 'Could not assign role. Please try again.'),
    )
  }
})
