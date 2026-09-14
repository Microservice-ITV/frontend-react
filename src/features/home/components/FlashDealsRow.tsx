import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { flashDealApi } from '@/features/products/api/flashDealApi'
import type { GqlFlashDealProduct } from '@/features/products/types/flashDealTypes'

export interface FlashDealItem {
  id: string
  name: string
  image: string
  originalPrice: number
  dealPrice: number
  discountPercent: number
  soldCount: number
  totalStock: number
  status: 'selling_fast' | 'only_left' | 'sold_out'
  shopName: string
}

interface FlashDealsRowProps {
  title?: string
  countdownEndTime?: string
  items?: FlashDealItem[]
  seeAllHref?: string
  cardsPerView?: number
}

const gqlProductToItem = (p: GqlFlashDealProduct): FlashDealItem => ({
  id: p.productId,
  name: p.title,
  image: p.imageUrl,
  originalPrice: p.originalPrice,
  dealPrice: p.dealPrice,
  discountPercent: p.discountPercent,
  soldCount: p.soldStock,
  totalStock: p.allocatedStock,
  status: p.remainingStock <= 0 ? 'sold_out' : p.remainingStock <= 10 ? 'only_left' : 'selling_fast',
  shopName: p.shopName,
})

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" fill="#ffffff"/><path d="M50 25a25 25 0 1 0 0 50 25 25 0 0 0 0-50zm0 5a20 20 0 1 1 0 40 20 20 0 0 1 0-40z" fill="#e0e0e0"/><path d="M50 35a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" fill="#d0d0d0"/></svg>`
const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(FALLBACK_SVG)}`

export const FlashDealsRow = ({
  title = 'FLASH DEALS',
  countdownEndTime,
  items = [],
  seeAllHref = '/flash-deals',
  cardsPerView = 6,
}: FlashDealsRowProps) => {
  const [timeRemaining, setTimeRemaining] = useState({ hours: '00', minutes: '00', seconds: '00' })
  const [currentPage, setCurrentPage] = useState(0)
  const [liveItems, setLiveItems] = useState<FlashDealItem[]>([])
  const [liveCountdownEnd, setLiveCountdownEnd] = useState<string | null>(null)

  const effectiveItems = liveItems.length > 0 ? liveItems : items
  const effectiveCountdownEnd = liveCountdownEnd ?? countdownEndTime

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await flashDealApi.getFlashDealCampaigns()
        if (cancelled) return

        const now = new Date()
        const activeCampaigns = data.getFlashDealCampaigns.filter(
          (c) =>
            c.status === 'ACTIVE' &&
            new Date(c.startTime) <= now &&
            new Date(c.endTime) >= now,
        )
        const liveSlots = activeCampaigns.flatMap((c) =>
          (c.slots || []).filter((s) => s.status === 'ACTIVE'),
        )
        const hasStock = (s: (typeof liveSlots)[number]) =>
          (s.products || []).some((p) => p.status === 'ACTIVE' && p.remainingStock > 0)
        const isLiveNow = (s: (typeof liveSlots)[number]) =>
          new Date(s.startTime) <= now && new Date(s.endTime) >= now

        const target =
          liveSlots.find((s) => isLiveNow(s) && hasStock(s)) ??
          liveSlots.find((s) => isLiveNow(s)) ??
          liveSlots.find((s) => new Date(s.startTime) > now) ??
          null

        if (!target) {
          setLiveItems([])
          setLiveCountdownEnd(null)
          return
        }

        const products = (target.products || []).filter(
          (p) => p.status === 'ACTIVE' && p.remainingStock > 0,
        )
        setLiveCountdownEnd(new Date(target.endTime).toISOString())
        setLiveItems(products.map(gqlProductToItem))
      } catch {
        if (!cancelled) {
          setLiveItems([])
          setLiveCountdownEnd(null)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const calculateRemaining = () => {
      if (!effectiveCountdownEnd) return { hours: '00', minutes: '00', seconds: '00' }

      const end = new Date(effectiveCountdownEnd).getTime()
      const now = new Date().getTime()
      const diff = end - now

      if (diff <= 0) {
        return { hours: '00', minutes: '00', seconds: '00' }
      }

      const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0')
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')
      const seconds = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0')

      return { hours, minutes, seconds }
    }

    const updateTime = () => setTimeRemaining(calculateRemaining())
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [effectiveCountdownEnd])

  const getProgressPercent = (item: FlashDealItem) => {
    return Math.min(Math.round((item.soldCount / item.totalStock) * 100), 100)
  }

  const getProgressLabel = (item: FlashDealItem) => {
    const remaining = item.totalStock - item.soldCount
    if (remaining <= 0) return 'SOLD OUT'
    if (remaining <= 10) return `ONLY ${remaining} LEFT`
    return 'SELLING FAST'
  }

  const totalPages = useMemo(
    () => Math.ceil(effectiveItems.length / cardsPerView),
    [effectiveItems.length, cardsPerView],
  )
  const visibleItems = useMemo(() => {
    const start = currentPage * cardsPerView
    return effectiveItems.slice(start, start + cardsPerView)
  }, [effectiveItems, currentPage, cardsPerView])

  const canGoPrev = currentPage > 0
  const canGoNext = currentPage < totalPages - 1

  const scrollToPage = useCallback((page: number) => {
    if (page < 0 || page >= totalPages) return
    setCurrentPage(page)
  }, [totalPages])

  const handlePrev = useCallback(() => {
    if (canGoPrev) scrollToPage(currentPage - 1)
  }, [canGoPrev, currentPage, scrollToPage])

  const handleNext = useCallback(() => {
    if (canGoNext) scrollToPage(currentPage + 1)
  }, [canGoNext, currentPage, scrollToPage])

  return (
    <section className="bg-transparent py-4 font-sans group relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        {/* HEADER - Shopee Style */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--dni-primary)]">
              <span aria-hidden="true">🔥</span>
              {title}
            </h2>
            <div className="flex items-center gap-1" aria-label="Countdown timer">
              <span className="mx-0.5 rounded-sm bg-[var(--dni-primary)] px-1.5 py-0.5 text-xs font-bold text-white">
                {timeRemaining.hours}
              </span>
              <span className="text-gray-400 font-mono text-xs leading-none">:</span>
              <span className="bg-[var(--dni-primary)] text-white text-xs font-bold px-1.5 py-0.5 rounded-sm mx-0.5">
                {timeRemaining.minutes}
              </span>
              <span className="text-gray-400 font-mono text-xs leading-none">:</span>
              <span className="bg-[var(--dni-primary)] text-white text-xs font-bold px-1.5 py-0.5 rounded-sm mx-0.5">
                {timeRemaining.seconds}
              </span>
            </div>
          </div>
          <Link
            to={seeAllHref}
            className="flex items-center gap-1 text-sm font-medium text-[var(--dni-primary)] no-underline transition-colors hover:text-[var(--dni-primary-hover)] hover:no-underline"
          >
            See All
            <span aria-hidden="true">›</span>
          </Link>
        </div>

        {/* PRODUCT LIST - Uses the same flat base surface as the category section */}
        <div className="relative group">
            {/* LEFT NAVIGATION ARROW - Shopee .carousel-arrow style */}
            {canGoPrev && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-0 top-1/2 z-40 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 scale-75 cursor-pointer items-center justify-center rounded-full bg-white/80 text-gray-600 opacity-0 shadow-md transition-all duration-200 ease-out pointer-events-none group-hover:pointer-events-auto group-hover:scale-90 group-hover:opacity-100 hover:!scale-125 hover:!bg-white hover:!text-black focus:pointer-events-auto focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--dni-primary)] group/btn"
                aria-label="Previous page"
              >
                <svg className="w-4 h-4 stroke-[3] transition-transform duration-200 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* RIGHT NAVIGATION ARROW - Shopee .carousel-arrow style (z-40 for clean overlap) */}
            {canGoNext && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-0 top-1/2 z-40 flex h-10 w-10 translate-x-1/2 -translate-y-1/2 scale-75 cursor-pointer items-center justify-center rounded-full bg-white/80 text-gray-600 opacity-0 shadow-md transition-all duration-200 ease-out pointer-events-none group-hover:pointer-events-auto group-hover:scale-90 group-hover:opacity-100 hover:!scale-125 hover:!bg-white hover:!text-black focus:pointer-events-auto focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--dni-primary)] group/btn"
                aria-label="Next page"
              >
                <svg className="w-4 h-4 stroke-[3] transition-transform duration-200 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* GRID LAYOUT - Exactly 6 cards per view */}
            <div className="grid w-full grid-cols-2 gap-2 overflow-hidden sm:grid-cols-3 lg:grid-cols-6">
              {effectiveItems.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-sm text-slate-500">No live flash deals right now</p>
                  <Link
                    to={seeAllHref}
                    className="mt-2 text-sm font-medium text-[var(--dni-primary)] no-underline hover:text-[var(--dni-primary-hover)] hover:no-underline"
                  >
                    See All ›
                  </Link>
                </div>
              )}
              {visibleItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/products/${item.id}`}
                  className="block no-underline hover:no-underline"
                >
                  <article className="group flex h-full flex-col overflow-hidden rounded-sm border border-[var(--dni-border)] bg-white transition-all duration-200 hover:border-[var(--dni-primary)] hover:shadow-md cursor-pointer">
                    {/* TOP ZONE: IMAGE CONTAINER - relative w-full aspect-square bg-gray-100 overflow-hidden rounded-t */}
                    <div className="relative w-full aspect-square overflow-hidden bg-white">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMAGE
                        }}
                      />

                      {/* MALL BADGE - Top Left (INSIDE image container) */}
                      <span className="absolute top-1 left-1 z-10 rounded-sm bg-[var(--dni-primary)] px-1 text-[10px] font-semibold text-white">
                        Mall
                      </span>

                      {/* DISCOUNT BADGE - Top Right (INSIDE image container) */}
                      <span className="absolute right-0 top-0 z-10 rounded-bl-sm bg-[var(--dni-primary-soft)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--dni-primary)]">
                        -{item.discountPercent}%
                      </span>
                    </div>

                    {/* BOTTOM ZONE: CONTENT DETAILS - p-2 flex flex-col justify-between flex-1 bg-white */}
                    <div className="flex min-h-0 flex-1 flex-col justify-between bg-white p-2.5 font-sans transition-colors duration-200">
                      {/* PRODUCT TITLE - Dark charcoal, strict height & line-clamp for uniform row alignment */}
                      <h3 className="h-8 text-xs text-[#202124] line-clamp-2 leading-snug font-medium mb-2 mt-1 overflow-hidden no-underline hover:no-underline">
                        {item.name}
                      </h3>

                      {/* PRICE SECTION */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="flex items-center text-base font-semibold text-[var(--dni-primary)]">
                          ${item.dealPrice.toFixed(item.dealPrice % 1 === 0 ? 0 : 2)}
                        </span>
                        <span className="text-[#9aa0a6] text-xs line-through ml-1.5 font-normal">
                          ${item.originalPrice.toFixed(item.originalPrice % 1 === 0 ? 0 : 2)}
                        </span>
                      </div>

                      {/* URGENCY PROGRESS BAR - Shopee Style */}
                      <div className="relative mt-2 flex h-4 w-full items-center justify-center overflow-hidden rounded-full bg-[var(--dni-primary-100)]">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full bg-[var(--dni-primary)] transition-all duration-500 ease-out"
                          style={{ width: `${getProgressPercent(item)}%` }}
                          role="progressbar"
                          aria-valuenow={getProgressPercent(item)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${getProgressPercent(item)}% claimed`}
                        />
                        <span className="relative z-10 text-[9px] font-bold text-white uppercase tracking-wide drop-shadow-sm">
                          {getProgressLabel(item)}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
        </div>
      </div>
    </section>
  )
}

export default FlashDealsRow