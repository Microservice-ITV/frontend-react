import type { RootState } from '@/app/store'
import { ROLE_CAPABILITIES } from './policies'
import { extractRolesFromUser } from './normalizers'
import type { AppRole, Capability } from './types'

export const selectAuthRole = (state: RootState): AppRole =>
  extractRolesFromUser(state.auth.user)

export const selectRoleCapabilities = (state: RootState): Capability[] =>
  ROLE_CAPABILITIES[selectAuthRole(state)]

export const can = (state: RootState, capability: Capability): boolean => {
  const capabilities = selectRoleCapabilities(state)
  return capabilities.includes('*') || capabilities.includes(capability)
}

export const canAny = (state: RootState, requiredCapabilities: readonly Capability[]): boolean => {
  if (requiredCapabilities.length === 0) return true
  return requiredCapabilities.some((capability) => can(state, capability))
}
