import { useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import AccountSidebar from '../components/AccountSidebar'
import { useSiteHeaderHeight } from '../hooks/useSiteHeaderHeight'

const AccountLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileBarRef = useRef<HTMLDivElement>(null)
  useSiteHeaderHeight()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((open) => {
      const next = !open
      if (next) {
        // Sticky + tall menu traps scroll; bring the bar on-screen then release sticky.
        requestAnimationFrame(() => {
          mobileBarRef.current?.scrollIntoView({ block: 'start' })
        })
      }
      return next
    })
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <div className="mx-auto max-w-6xl px-4 pt-0 md:pt-6">
        {/* Sticky only while closed — a sticky block taller than the viewport can trap scroll. */}
        <div
          ref={mobileBarRef}
          className={`z-40 -mx-4 mb-4 scroll-mt-[var(--site-header-height,7rem)] border-b border-gray-200 bg-[#f5f5f5] px-4 py-3 md:hidden ${
            isMobileMenuOpen
              ? 'relative'
              : 'sticky top-[var(--site-header-height,7rem)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <h1 className="text-base font-medium text-gray-900">My Account</h1>
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? 'Close account menu' : 'Open account menu'}
              aria-expanded={isMobileMenuOpen}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border border-gray-300 bg-white text-gray-900 active:bg-gray-100"
            >
              {isMobileMenuOpen ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="mt-3 rounded-sm border border-gray-200 bg-white shadow-sm">
              <AccountSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[16rem_minmax(0,1fr)] md:items-start">
          <div className="hidden md:block md:w-64 md:self-start">
            <AccountSidebar />
          </div>

          <section className="min-w-0 rounded-sm border border-gray-200 bg-white shadow-sm">
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  )
}

export default AccountLayout
