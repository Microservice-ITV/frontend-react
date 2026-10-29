import { useEffect, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { employeeApi } from '../api/employeeApi'
import { selectRoleCapabilities } from '@/app/rbac/selectors'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import type { Employee } from '../types/employeeTypes'

export type EmployeePortalType = 'warehouse' | 'delivery' | 'general'
export type EmployeeLayoutType = 'minimal' | 'warehouse_manager' | 'delivery_agent' | 'general'

interface UseEmployeePortalResult {
  employee: Employee | null
  portalType: EmployeePortalType
  layoutType: EmployeeLayoutType
  loading: boolean
  error: string | null
}

const PORTAL_DEPARTMENT_CODES = {
  warehouse: ['WH', 'WAREHOUSE', 'WAREHOUSE_STAFF', 'STOREKEEPER', 'WAREHOUSE_MANAGER'],
  delivery: ['DEL', 'DELIVERY', 'DELIVERY_AGENT', 'DRIVER', 'COURIER'],
} as const

const PORTAL_POSITION_CODES = {
  warehouse: ['WH_STAFF', 'WAREHOUSE_STAFF', 'STOREKEEPER', 'WH_MGR', 'WAREHOUSE_MANAGER'],
  delivery: ['DEL_AGENT', 'DELIVERY_AGENT', 'DRIVER', 'COURIER'],
} as const

function matchesPortal(
  value: string | undefined | null,
  codes: readonly string[]
): boolean {
  if (!value) return false
  const upper = value.toUpperCase()
  return codes.some((code) => upper.includes(code.toUpperCase()))
}

function determinePortalType(employee: Employee): EmployeePortalType {
  const deptCode = employee.department?.code
  const deptName = employee.department?.name
  const posCode = employee.position?.code
  const posTitle = employee.position?.title

  if (
    matchesPortal(deptCode, PORTAL_DEPARTMENT_CODES.warehouse) ||
    matchesPortal(deptName, PORTAL_DEPARTMENT_CODES.warehouse) ||
    matchesPortal(posCode, PORTAL_POSITION_CODES.warehouse) ||
    matchesPortal(posTitle, PORTAL_POSITION_CODES.warehouse)
  ) {
    return 'warehouse'
  }

  if (
    matchesPortal(deptCode, PORTAL_DEPARTMENT_CODES.delivery) ||
    matchesPortal(deptName, PORTAL_DEPARTMENT_CODES.delivery) ||
    matchesPortal(posCode, PORTAL_POSITION_CODES.delivery) ||
    matchesPortal(posTitle, PORTAL_POSITION_CODES.delivery)
  ) {
    return 'delivery'
  }

  return 'general'
}

function hasManagementCapabilities(userCapabilities: readonly string[]): boolean {
  return (
    userCapabilities.includes(CAPABILITIES.WAREHOUSE_DASHBOARD_VIEW) ||
    userCapabilities.includes(CAPABILITIES.DELIVERY_DASHBOARD_VIEW) ||
    userCapabilities.includes(CAPABILITIES.PLATFORM_ADMIN_VIEW) ||
    userCapabilities.includes(CAPABILITIES.SELLER_DASHBOARD_VIEW)
  )
}

export const useEmployeePortal = (): UseEmployeePortalResult => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const userId = useAppSelector((state) => state.auth.user?.id ?? null)
  const userCapabilities = useAppSelector(selectRoleCapabilities)

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [portalType, setPortalType] = useState<EmployeePortalType>('general')
  const [layoutType, setLayoutType] = useState<EmployeeLayoutType>('general')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setLoading(false)
      return
    }

    let cancelled = false

    employeeApi
      .getMyEmployee()
      .then((response) => {
        if (cancelled) return
        const emp = response.data.data.employee
        const type = determinePortalType(emp)
        setEmployee(emp)
        setPortalType(type)

        // Determine layout type based on portal type + management capabilities
        const isManagement = hasManagementCapabilities(userCapabilities)
        let layout: EmployeeLayoutType = 'general'

        switch (type) {
          case 'warehouse':
            layout = isManagement ? 'warehouse_manager' : 'minimal'
            break
          case 'delivery':
            layout = isManagement ? 'delivery_agent' : 'minimal'
            break
          case 'general':
          default:
            layout = 'minimal'
            break
        }

        setLayoutType(layout)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message ?? 'Failed to load employee profile')
        setPortalType('general')
        setLayoutType('minimal')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, userId, userCapabilities])

  return { employee, portalType, layoutType, loading, error }
}

export default useEmployeePortal