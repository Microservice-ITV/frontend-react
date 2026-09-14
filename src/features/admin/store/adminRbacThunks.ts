import { createAsyncThunk } from '@reduxjs/toolkit'
import { adminRbacApi, type RbacPermissionDto, type RbacRoleDto } from '../api/adminRbacApi'
import type { RbacPermissionGroup, RbacRoleRow } from '../types/rbacTypes'

const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const groupPermissions = (role: RbacRoleDto): RbacPermissionGroup[] => {
  const byModule = new Map<string, string[]>()

  for (const permission of role.permissions ?? []) {
    const module = permission.module?.trim() || permission.code.split('.')[0] || 'misc'
    const action = permission.action?.trim() || permission.code
    const actions = byModule.get(module) ?? []
    if (!actions.includes(action)) actions.push(action)
    byModule.set(module, actions)
  }

  return Array.from(byModule.entries())
    .map(([module, actions]) => ({
      module,
      actions: actions.sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.module.localeCompare(b.module))
}

const mapRoleRow = (role: RbacRoleDto): RbacRoleRow => ({
  id: role.id,
  code: role.code,
  name: role.name,
  scope: role.scope,
  isSystem: role.is_system,
  permissionCount: role.permissions?.length ?? 0,
  permissionCodes: (role.permissions ?? []).map((permission) => permission.code),
  permissionGroups: groupPermissions(role),
  created: formatDate(role.created_at),
})

export const fetchAdminRbacRoles = createAsyncThunk<
  RbacRoleRow[],
  void,
  { rejectValue: string }
>('adminRbac/fetchRoles', async (_, { rejectWithValue }) => {
  try {
    const response = await adminRbacApi.listRoles()
    const roles = response.data?.data?.roles ?? []
    return roles.map(mapRoleRow)
  } catch (error: unknown) {
    return rejectWithValue(
      adminRbacApi.getApiErrorMessage(
        error,
        'Unable to load roles and permissions right now. Please try again.',
      ),
    )
  }
})

export const fetchAdminRbacPermissions = createAsyncThunk<
  RbacPermissionDto[],
  void,
  { rejectValue: string }
>('adminRbac/fetchPermissions', async (_, { rejectWithValue }) => {
  try {
    const response = await adminRbacApi.listPermissions()
    return response.data?.data?.permissions ?? []
  } catch (error: unknown) {
    return rejectWithValue(
      adminRbacApi.getApiErrorMessage(
        error,
        'Unable to load available permissions right now. Please try again.',
      ),
    )
  }
})

export const updateAdminRbacRolePermissions = createAsyncThunk<
  void,
  { roleId: string; permissionCodes: string[] },
  { rejectValue: string }
>('adminRbac/updateRolePermissions', async ({ roleId, permissionCodes }, { dispatch, rejectWithValue }) => {
  try {
    await adminRbacApi.updateRolePermissions(roleId, permissionCodes)
    await dispatch(fetchAdminRbacRoles()).unwrap()
  } catch (error: unknown) {
    return rejectWithValue(
      adminRbacApi.getApiErrorMessage(
        error,
        'Could not update role permissions. Please try again.',
      ),
    )
  }
})