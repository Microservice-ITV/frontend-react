import { useAppSelector } from '@/app/hooks'
import type { Capability } from './types'
import { can, canAny, selectAuthRole, selectRoleCapabilities } from './selectors'

export const useAuthRole = () => useAppSelector(selectAuthRole)

export const useRoleCapabilities = () => useAppSelector(selectRoleCapabilities)

export const useCan = (capability: Capability) =>
  useAppSelector((state) => can(state, capability))

export const useCanAny = (requiredCapabilities: Capability[]) =>
  useAppSelector((state) => canAny(state, requiredCapabilities))
