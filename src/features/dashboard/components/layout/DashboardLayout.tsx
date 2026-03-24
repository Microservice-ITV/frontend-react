import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import DashboardSidebar from './DashboardSidebar'
import DashboardTopbar from './DashboardTopbar'
import type { DashboardArea } from '../../types/dashboardTypes'

type DashboardLayoutProps = {
  area: DashboardArea
}

const DashboardLayout = ({ area }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const openSidebar = () => setSidebarOpen(true)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <DashboardSidebar
          area={area}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        <div className="min-w-0 flex-1">
          <DashboardTopbar area={area} onMenuClick={openSidebar} />
          <main className="p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout