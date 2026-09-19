import { Link, Outlet, useLocation } from 'react-router-dom'
import { Sparkles, Flame } from 'lucide-react'

const PromotionEngineLayout = () => {
  const location = useLocation()
  const isFlashDeals = location.pathname.startsWith('/super-admin/promotion-engine/flash-deals')

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500">
        <Link to="/super-admin/overview" className="hover:text-slate-700">
          Dashboard
        </Link>
        <span className="mx-1">/</span>
        <span className="text-slate-900">Promotion Engine</span>
      </nav>

      <div>
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-emerald-700">
          <Sparkles size={15} /> Promotion engine
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Promotion Engine</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Manage promotions, flash sales, and time-limited campaigns in one place.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2">
        <Link
          to="/super-admin/promotion-engine"
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
            !isFlashDeals
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles size={14} />
          Overview
        </Link>
        <Link
          to="/super-admin/promotion-engine/flash-deals"
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
            isFlashDeals
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame size={14} />
          Flash Deals
        </Link>
      </div>

      <Outlet />
    </div>
  )
}

export default PromotionEngineLayout