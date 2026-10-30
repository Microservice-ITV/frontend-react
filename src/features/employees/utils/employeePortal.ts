import { employeeApi } from '@/features/employees/api/employeeApi'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import type { Employee } from '@/features/employees/types/employeeTypes'
import { selectRoleCapabilities } from '@/app/rbac/selectors'
import { useAppSelector } from '@/app/hooks'
import { useEffect, useState } from 'react'

export type EmployeePortalType = 'warehouse' | 'delivery' | 'general'
export type EmployeeLayoutType = 'minimal' | 'warehouse_manager' | 'delivery_agent' | 'general'

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

export function determinePortalType(employee: Employee): EmployeePortalType {
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

export function hasManagementCapabilities(userCapabilities: readonly string[]): boolean {
  return (
    userCapabilities.includes(CAPABILITIES.WAREHOUSE_DASHBOARD_VIEW) ||
    userCapabilities.includes(CAPABILITIES.DELIVERY_DASHBOARD_VIEW) ||
    userCapabilities.includes(CAPABILITIES.PLATFORM_ADMIN_VIEW) ||
    userCapabilities.includes(CAPABILITIES.SELLER_DASHBOARD_VIEW)
  )
}

export function determineLayoutType(
  portalType: EmployeePortalType,
  userCapabilities: readonly string[]
): EmployeeLayoutType {
  const isManagement = hasManagementCapabilities(userCapabilities)

  switch (portalType) {
    case 'warehouse':
      return isManagement ? 'warehouse_manager' : 'minimal'
    case 'delivery':
      return isManagement ? 'delivery_agent' : 'minimal'
    case 'general':
    default:
      return 'minimal'
  }
}

export function getPortalRoute(
  layoutType: EmployeeLayoutType
): string {
  switch (layoutType) {
    case 'warehouse_manager':
      return '/warehouse/my-leave'
    case 'delivery_agent':
      return '/delivery/my-leave'
    case 'minimal':
    case 'general':
    default:
      return '/employee/my-leave'
  }
}

export async function getEmployeePortalRoute(
  userCapabilities: readonly string[]
): Promise<string | null> {
  try {
    const response = await employeeApi.getMyEmployee()
    const employee = response.data.data.employee

    if (!employee || employee.employment_status === 'terminated') {
      return null
    }

    const portalType = determinePortalType(employee)
    const layoutType = determineLayoutType(portalType, userCapabilities)
    return getPortalRoute(layoutType)
  } catch {
    return null
  }
}