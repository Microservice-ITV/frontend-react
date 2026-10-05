import { ChevronRight, Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Shop } from '../types/shopTypes'

interface ShopSearchListProps {
  shops: Shop[]
}

const ShopSearchList = ({ shops }: ShopSearchListProps) => {
  const navigate = useNavigate()

  return (
    <ul className="overflow-hidden rounded-sm border border-[var(--dni-cart-border)] bg-white">
      {shops.map(shop => {
        const handle = shop.domain?.trim() || ''

        return (
          <li
            key={shop.id}
            className="border-b border-[var(--dni-cart-border)] last:border-b-0"
          >
            <button
              type="button"
              onClick={() => navigate(`/shops/${shop.id}`)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[#fafdff] sm:gap-4 sm:px-4 sm:py-3.5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-emerald-100 bg-emerald-50 text-emerald-700 sm:h-14 sm:w-14">
                <Store size={22} aria-hidden />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 sm:text-[15px]">
                  {shop.name}
                </p>
                {handle ? (
                  <p className="mt-0.5 truncate text-xs text-gray-500 sm:text-sm">{handle}</p>
                ) : (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                    <Store size={12} aria-hidden />
                    Shop
                  </p>
                )}
              </div>

              <span className="hidden shrink-0 items-center gap-0.5 text-sm font-medium text-emerald-700 sm:inline-flex">
                View Shop
                <ChevronRight size={16} aria-hidden />
              </span>
              <ChevronRight
                size={18}
                className="shrink-0 text-gray-400 sm:hidden"
                aria-hidden
              />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default ShopSearchList
