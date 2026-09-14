import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { FlashDealCard } from '../components/FlashDealCard'
import {
  setActiveSlotId,
  setActiveCategory,
} from '../store/flashDealSlice'
import {
  fetchFlashDealCampaigns,
  fetchFlashDealsBySlot,
} from '../store/flashDealThunks'

// ─────────────────────────────────────────────
// Static tab lists
// ─────────────────────────────────────────────
const CATEGORY_TABS = [
  'Top Picks',
  'Mooncake',
  'Buy Today, Get Today',
  'Shopee Supermarket',
  'Home Appliances',
  'Electronics',
  'More ▾',
]

const MORE_CATEGORIES = [
  'Deal Vouchers',
  'Home Furnishings',
  'Kids & Babies',
  'Health & Beauty',
  'Fashion',
  'Sports & Outdoors',
  'Automotive',
  'Pet Supplies',
]

const MOCK_VOUCHER_BADGES = [
  { text: '9.9 FREE SHIPPING', color: 'bg-[#2563eb] text-white' },
  { text: '20% SHOP VOUCHERS', color: 'bg-[#7c3aed] text-white' },
]

// ─────────────────────────────────────────────
// Skeleton loader
// ─────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-sm overflow-hidden shadow-sm animate-pulse h-full flex flex-col">
      <div className="aspect-square w-full bg-gray-200" />
      <div className="p-2 flex flex-col gap-2 flex-1">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mt-1" />
        <div className="h-4 bg-gray-100 rounded-full mt-auto" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Countdown timer pill helper
// ─────────────────────────────────────────────
function CountdownPill({ value }: { value: string }) {
  return (
    <span className="inline-block min-w-[2.25rem] rounded-sm bg-[var(--dni-primary)] px-1.5 py-0.5 text-center font-mono text-sm text-white">
      {value}
    </span>
  )
}

// ─────────────────────────────────────────────
// FlashDealsPage
// ─────────────────────────────────────────────
const FlashDealsPage = () => {
  const dispatch = useAppDispatch()
  const {
    products,
    timeSlots,
    activeSlotId,
    activeCategory,
    status,
    error,
  } = useAppSelector((s) => s.flashDeals)

  const [showMoreDropdown, setShowMoreDropdown] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState('00:00:00')

  // ── Fetch campaigns on mount ──
  useEffect(() => {
    dispatch(fetchFlashDealCampaigns())
  }, [dispatch])

  // ── Fetch products when activeSlotId changes ──
  useEffect(() => {
    if (activeSlotId) {
      dispatch(fetchFlashDealsBySlot({ slotId: activeSlotId }))
    }
  }, [dispatch, activeSlotId])

  // ── Countdown timer ──
  useEffect(() => {
    const activeSlot = timeSlots.find((s) => s.id === activeSlotId)
    if (!activeSlot) return

    const calculateRemaining = () => {
      const now = new Date()
      const end = activeSlot.endTime
      const diff = end.getTime() - now.getTime()
      if (diff <= 0) return '00:00:00'
      const h = Math.floor(diff / (1000 * 60 * 60))
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((diff % (1000 * 60)) / 1000)
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    setTimeRemaining(calculateRemaining())
    const interval = setInterval(() => setTimeRemaining(calculateRemaining()), 1000)
    return () => clearInterval(interval)
  }, [activeSlotId, timeSlots])

  // ── Derived state ──
  const activeSlot = useMemo(() => timeSlots.find((s) => s.id === activeSlotId), [timeSlots, activeSlotId])
  const isOngoing = activeSlot?.status === 'ongoing'
  const [hours, minutes, seconds] = timeRemaining.split(':')

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'Top Picks') return products
    return products.filter((p) => {
      const name = p.name.toLowerCase()
      const cat = activeCategory.toLowerCase()
      return name.includes(cat)
    })
  }, [products, activeCategory])

  const handleSlotClick = useCallback(
    (slotId: string) => {
      dispatch(setActiveSlotId(slotId))
    },
    [dispatch],
  )

  const handleCategoryClick = useCallback(
    (cat: string) => {
      dispatch(setActiveCategory(cat))
    },
    [dispatch],
  )

  const isLoading = status === 'loading'

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── SHOPEE FLASH DEALS HEADER ── */}
      <div className="flex items-center justify-center gap-3 border-b border-[var(--dni-border)] bg-white py-4 text-lg font-bold uppercase tracking-wide text-[var(--dni-primary)]">
        {/* Flame icon */}
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 23c-3.6 0-8-2.4-8-7.7C4 10 12 1 12 1s8 9 8 14.3c0 5.3-4.4 7.7-8 7.7zm0-18.5C9.1 7.5 6 13 6 15.3 6 19 8.7 21 12 21s6-2 6-5.7C18 13 14.9 7.5 12 4.5z" />
          <path d="M12 21c-1.7 0-3-1-3-2.7 0-1.6 1.5-3.7 3-6 1.5 2.3 3 4.4 3 6 0 1.7-1.3 2.7-3 2.7z" />
        </svg>
        <span>FLASH DEALS</span>
        <span className="text-sm font-medium text-[var(--dni-primary)]/80">ENDS IN</span>
        <CountdownPill value={hours} />
        <span className="text-sm font-bold">:</span>
        <CountdownPill value={minutes} />
        <span className="text-sm font-bold">:</span>
        <CountdownPill value={seconds} />
      </div>

      {/* ── TIME SLOT SELECTOR BAR ── */}
      <div className="w-full bg-[#1f2937] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
            {timeSlots.slice(0, 4).map((slot) => {
              const isActive = slot.id === activeSlotId
              const isOngoingSlot = slot.status === 'ongoing'

              return (
                <button
                  key={slot.id}
                  onClick={() => handleSlotClick(slot.id)}
                  className={`relative flex flex-col items-center text-center transition-all duration-200 ${
                    isActive
                        ? 'bg-[var(--dni-primary)] text-white'
                        : 'bg-[#374151] text-gray-200 hover:bg-[#4b5563]'
                      } rounded-sm px-2 py-3 no-underline hover:no-underline`}
                >
                  <span className={`text-lg font-bold ${isActive ? 'text-white' : 'text-gray-200'}`}>
                    {slot.time}
                  </span>
                  <span className={`text-[11px] font-medium mt-1 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {isOngoingSlot ? 'Ongoing' : 'Coming Soon'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── CATEGORY SUB-HEADER TABS ── */}
      <div className="sticky top-0 z-30 border-b border-[var(--dni-border)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-6 py-3 overflow-x-auto scrollbar-hide relative">
            {CATEGORY_TABS.map((tab) => {
              const isMore = tab === 'More ▾'
              const isActive = !isMore && activeCategory === tab

              return (
                <div key={tab} className="relative flex-shrink-0">
                  {isMore ? (
                    <>
                      <button
                        onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors no-underline hover:no-underline ${
                          showMoreDropdown ? 'text-[var(--dni-primary)]' : 'text-gray-700 hover:text-[var(--dni-primary)]'
                        }`}
                      >
                        <span>More</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${showMoreDropdown ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showMoreDropdown && (
                        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[var(--dni-border)] bg-white py-1 shadow-lg">
                          {MORE_CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => {
                                handleCategoryClick(cat)
                                setShowMoreDropdown(false)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-[var(--dni-primary-soft)] hover:text-[var(--dni-primary)] no-underline"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleCategoryClick(tab)}
                      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors no-underline hover:no-underline ${
                        isActive
                          ? 'border-[var(--dni-primary)] text-[var(--dni-primary)] font-semibold'
                          : 'border-transparent text-gray-700 hover:border-[var(--dni-primary)] hover:text-[var(--dni-primary)]'
                      }`}
                    >
                      {tab}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Error state */}
        {error && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Something went wrong</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => dispatch(fetchFlashDealCampaigns())}
              className="rounded bg-[var(--dni-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--dni-primary-hover)]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && !error && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Products */}
        {!isLoading && !error && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <FlashDealCard
                key={product.id}
                product={product}
                isOngoing={isOngoing}
                voucherBadges={MOCK_VOUCHER_BADGES}
              />
            ))}

            {/* Empty state */}
            {filteredProducts.length === 0 && !isOngoing && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Coming Soon</h3>
                <p className="text-gray-500">
                  {activeSlot ? `Deals start at ${activeSlot.time}` : 'No deals scheduled for this slot'}
                </p>
              </div>
            )}

            {/* Empty state - ongoing but no products */}
            {filteredProducts.length === 0 && isOngoing && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Products Available</h3>
                <p className="text-gray-500">All deals in this slot have been claimed.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default FlashDealsPage
