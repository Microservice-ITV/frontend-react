import type { RbacPermissionDto } from '../api/adminRbacApi'

export type RbacScope = 'platform' | 'shop' | 'self' | string

export type RbacPermissionGroup = {
  module: string
  actions: string[]
}

export type RbacRoleRow = {
  id: string
  code: string
  name: string
  scope: RbacScope
  isSystem: boolean
  permissionCount: number
  permissionCodes: string[]
  permissionGroups: RbacPermissionGroup[]
  created: string
}

export type AdminRbacState = {
  roles: RbacRoleRow[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  permissions: RbacPermissionDto[]
  permissionsStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  permissionsError: string | null
  updateStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  updateError: string | null
}