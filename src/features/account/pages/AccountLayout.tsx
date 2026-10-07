import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AccountSidebar from '../components/AccountSidebar'
import { menuIcon } from '@/assets/icons'

const AccountLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Mobile: title + menu button */}
        <div className="md:hidden mb-4 flex items-center justify-between">
          <h1 className="text-base font-medium text-gray-900">My Account</h1>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="p-2 rounded-sm border border-gray-300 bg-white active:bg-gray-100 cursor-pointer"
          >
            <img
              src={menuIcon}
              alt="Open account menu"
              className="w-5 h-5"
            />
          </button>
        </div>

        {/* Mobile: dropdown menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mb-4 border border-gray-200 rounded-sm bg-white shadow-sm">
            <AccountSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[16rem_minmax(0,1fr)] md:items-start">
          <div className="hidden md:block md:w-64 md:self-start">
            <AccountSidebar />
          </div>

          {/* Right: content */}
          <section className="min-w-0 bg-white rounded-sm border border-gray-200 shadow-sm">
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  )
}

export default AccountLayout
