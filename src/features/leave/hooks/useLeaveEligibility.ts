import { useEffect, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { useCan } from '@/app/rbac/hooks'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { employeeApi } from '@/features/employees/api/employeeApi'

/**
 * Whether the signed-in user may use leave self-service (My Leave).
 *
 * Two signals qualify a user:
 *  1. Their resolved role has the leave.view capability (HR/manager/employee roles), OR
 *  2. They are linked to an employee record in the employee-service — e.g. a shop
 *     staff account whose auth-service "effective role" is a plain customer.
 *
 * The employee lookup runs at most once per user and is cached for the session.
 */
const employeeCache = new Map<string, boolean>()

type LeaveEligibility = {
  /** True once the user may use leave self-service. */
  eligible: boolean
  /** True while the eligibility signal (role already resolved; employee pending). */
  loading: boolean
}

export const useLeaveEligibilityState = (enabled = true): LeaveEligibility => {
  const canViewLeave = useCan(CAPABILITIES.LEAVE_VIEW)
  const userId = useAppSelector((state) => state.auth.user?.id ?? null)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  const cached = userId ? employeeCache.get(userId) : undefined
  const [isEmployee, setIsEmployee] = useState<boolean>(cached ?? false)

  // Nothing to look up when the route does not need employee fallback or the
  // role already grants access.
  const skipLookup =
    !enabled || canViewLeave || !isAuthenticated || !userId || cached !== undefined

  useEffect(() => {
    if (skipLookup || !userId) return

    let active = true

    employeeApi
      .getMyEmployee()
      .then((response) => {
        const employee = response.data.data.employee
        const eligible = Boolean(employee) && employee.employment_status !== 'terminated'
        employeeCache.set(userId, eligible)
        if (active) setIsEmployee(eligible)
      })
      .catch(() => {
        employeeCache.set(userId, false)
        if (active) setIsEmployee(false)
      })

    return () => {
      active = false
    }
  }, [skipLookup, userId])

  if (canViewLeave) return { eligible: true, loading: false }

  const resolved = cached !== undefined
  return { eligible: isEmployee, loading: enabled && !resolved && !skipLookup }
}

export const useLeaveEligibility = (enabled = true): boolean =>
  useLeaveEligibilityState(enabled).eligible

export default useLeaveEligibility
