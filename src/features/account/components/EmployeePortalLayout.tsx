import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useEmployeePortal, type EmployeeLayoutType } from '@/features/employees/hooks/useEmployeePortal'
import DashboardLayout from '@/features/dashboard/components/layout/DashboardLayout'
import type { DashboardArea } from '@/features/dashboard/types/dashboardTypes'

const PORTAL_ROUTES: Record<EmployeeLayoutType, string> = {
  minimal: '/employee/my-leave',
  general: '/employee/my-leave',
  warehouse_manager: '/warehouse/my-leave',
  delivery_agent: '/delivery/my-leave',
}

const PORTAL_AREAS: Record<EmployeeLayoutType, DashboardArea> = {
  minimal: 'employee',
  general: 'employee',
  warehouse_manager: 'warehouse_manager',
  delivery_agent: 'delivery_agent',
}

const EmployeePortalLayout = () => {
  const location = useLocation()
  const { layoutType, loading, error } = useEmployeePortal()
  const [resolvedLayout, setResolvedLayout] = useState<EmployeeLayoutType | null>(null)

  useEffect(() => {
    if (!loading) {
      setResolvedLayout(layoutType)
    }
  }, [loading, layoutType])

  if (loading) {
    return (
      <div className="dni-dashboard min-h-screen overflow-x-clip bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-500 border-t-transparent mx-auto mb-3" />
          <p className="text-slate-600">Loading employee profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dni-dashboard min-h-screen overflow-x-clip bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-600 mb-2">Failed to load employee profile</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!resolvedLayout) {
    return null
  }

  const targetPath = PORTAL_ROUTES[resolvedLayout]

  if (location.pathname !== targetPath) {
    return <Navigate to={targetPath} replace />
  }

  return <DashboardLayout area={PORTAL_AREAS[resolvedLayout]} />
}

export default EmployeePortalLayout