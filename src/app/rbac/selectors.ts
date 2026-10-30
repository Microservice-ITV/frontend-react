import type { RootState } from '@/app/store'
import { getCapabilitiesForRoles } from './policies'
import { extractRoleFromUser, extractRolesFromUser } from './normalizers'
import type { AppRole, Capability } from './types'

export const selectAuthRole = (state: RootState): AppRole =>
  extractRoleFromUser(state.auth.user)

export const selectRoleCapabilities = (state: RootState): Capability[] =>
  getCapabilitiesForRoles(extractRolesFromUser(state.auth.user))

export const can = (state: RootState, capability: Capability): boolean => {
  const capabilities = selectRoleCapabilities(state)
  return capabilities.includes('*') || capabilities.includes(capability)
}

export const canAny = (state: RootState, requiredCapabilities: readonly Capability[]): boolean => {
  if (requiredCapabilities.length === 0) return true
  return requiredCapabilities.some((capability) => can(state, capability))
}
