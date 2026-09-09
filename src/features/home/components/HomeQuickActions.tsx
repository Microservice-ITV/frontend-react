import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchHomeQuickActions } from '../store/homeThunks'
import type { HomeFeature } from '../store/homeTypes'

const DESKTOP_PAGE_SIZE = 5

const isWithinSchedule = (feature: HomeFeature, now: number): boolean => {
  const start = feature.startAt ? new Date(feature.startAt).getTime() : null
  const end = feature.endAt ? new Date(feature.endAt).getTime() : null
  if (start != null && now < start) return false
  if (end != null && now > end) return false
  return true
}

const HomeQuickActions = () => {
  const dispatch = useAppDispatch()
  const { items, status, error } = useAppSelector((s) => s.homeQuickActions)
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (status === 'idle') {
      void dispatch(fetchHomeQuickActions())
    }
  }, [dispatch, status])

  const visibleFeatures = useMemo(() => {
    const now = Date.now()
    return items
      .filter((feature) => isWithinSchedule(feature, now))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [items])

  const totalPages = Math.max(1, Math.ceil(visibleFeatures.length / DESKTOP_PAGE_SIZE))

  useEffect(() => {
    if (page >= totalPages) {
      setPage(totalPages - 1)
    }
  }, [page, totalPages])

  const showArrows = visibleFeatures.length > DESKTOP_PAGE_SIZE

  const arrowButton =
    'absolute top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 transition-colors cursor-pointer hover:text-emerald-600 hover:border-emerald-400 disabled:opacity-0 disabled:pointer-events-none'

  const renderTile = (feature: HomeFeature) => (
    <div key={feature.id} className="shrink-0 px-2 md:w-1/5">
      <Link
        to="#"
        className="group flex flex-col items-center gap-2 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden transition-all group-hover:border-gray-200 group-hover:shadow-md">
          {feature.iconUrl ? (
            <img
              src={feature.iconUrl}
              alt={feature.name}
              className="max-w-[80%] max-h-[80%] object-contain transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <span className="text-xs text-gray-400">Icon</span>
          )}
        </div>
        <span className="text-xs text-gray-700 leading-tight text-center">
          {feature.name}
        </span>
      </Link>
    </div>
  )

  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="py-4">
          {status === 'loading' && visibleFeatures.length === 0 ? (
            <div className="py-2 text-sm text-gray-500">Loading quick actions...</div>
          ) : null}

          {status === 'failed' && visibleFeatures.length === 0 ? (
            <div className="py-2 text-sm text-red-500">
              {error || 'Failed to load quick actions.'}
            </div>
          ) : null}

          {visibleFeatures.length === 0 && status !== 'loading' && status !== 'failed' ? (
            <div className="py-2 text-sm text-gray-400">No quick actions available.</div>
          ) : null}

          {visibleFeatures.length > 0 ? (
            <>
              {/* MOBILE: touch scroll */}
              <div className="flex md:hidden gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                {visibleFeatures.map((feature) => renderTile(feature))}
              </div>

              {/* DESKTOP: paginated pages with Shopee-style arrows + slide animation */}
              <div className="relative hidden md:block">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${page * 100}%)` }}
                  >
                    {visibleFeatures.map((feature) => renderTile(feature))}
                  </div>
                </div>

                {showArrows ? (
                  <button
                    type="button"
                    aria-label="Previous page"
                    onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                    disabled={page === 0}
                    className={`${arrowButton} left-1`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                ) : null}

                {showArrows ? (
                  <button
                    type="button"
                    aria-label="Next page"
                    onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={page === totalPages - 1}
                    className={`${arrowButton} right-1`}
                  >
                    <ChevronRight size={18} />
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default HomeQuickActions