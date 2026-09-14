import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import ProductActions from './ProductActions'
import ProductVariantSelector, { pickDefaultVariant } from './ProductVariantSelector'
import type { ProductDetail, ProductVariant } from '@/features/products/types/productTypes'
import { getGalleryImagesForVariant } from '@/features/products/utils/variantGallery'
import { formatProductPrice, STORE_CURRENCY } from '@/features/products/utils/formatProductPrice'
import { stripYouTubeUrlsFromText } from '@/features/products/utils/videoEmbed'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'

interface Props {
  product: ProductDetail
  /** Fired when the active SKU changes (including initial default) — drives variant-specific gallery. */
  onSelectedVariantChange?: (variant: ProductVariant | null) => void
}

function formatMoney(n: number, currency?: string) {
  return formatProductPrice(n, currency || STORE_CURRENCY)
}

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, '0')
}

/** Countdown to end of local day — keeps the Flash Deals banner lively. */
function useEndOfDayCountdown() {
  const [parts, setParts] = useState(() => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    const ms = Math.max(0, end.getTime() - now.getTime())
    const totalSec = Math.floor(ms / 1000)
    return {
      h: pad2(Math.floor(totalSec / 3600)),
      m: pad2(Math.floor((totalSec % 3600) / 60)),
      s: pad2(totalSec % 60),
    }
  })

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const end = new Date(now)
      end.setHours(23, 59, 59, 999)
      const ms = Math.max(0, end.getTime() - now.getTime())
      const totalSec = Math.floor(ms / 1000)
      setParts({
        h: pad2(Math.floor(totalSec / 3600)),
        m: pad2(Math.floor((totalSec % 3600) / 60)),
        s: pad2(totalSec % 60),
      })
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return parts
}

function TrustIconCircle({ children }: { children: ReactNode }) {
  return (
    <span
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[var(--dni-primary)] text-[var(--dni-primary)]"
      aria-hidden
    >
      {children}
    </span>
  )
}

const ProductInfo = ({ product, onSelectedVariantChange }: Props) => {
  const [activeVariant, setActiveVariant] = useState<ProductVariant | null>(null)
  const countdown = useEndOfDayCountdown()

  const handleVariantChange = useCallback(
    (v: ProductVariant | null) => {
      setActiveVariant(v)
      onSelectedVariantChange?.(v)
    },
    [onSelectedVariantChange],
  )

  const variantSig = useMemo(
    () => product.variants.map((v) => v.variantId).sort().join(','),
    [product.variants],
  )
  useEffect(() => {
    const def = pickDefaultVariant(product.variants)
    setActiveVariant(def)
    onSelectedVariantChange?.(def)
  }, [product.id, variantSig, onSelectedVariantChange])

  const displayPrice = activeVariant?.price ?? product.price
  const listPrice = activeVariant?.listPrice ?? displayPrice
  const compareAt = activeVariant?.compareAtPrice

  /** Strikethrough “was” price: API `compareAtPrice` when set, else `listPrice` if above sale price */
  const strikePrice = useMemo(() => {
    if (compareAt != null && compareAt > displayPrice + 0.001) return compareAt
    if (listPrice > displayPrice + 0.001 && listPrice > 0) return listPrice
    return null
  }, [compareAt, listPrice, displayPrice])

  const showStrike = strikePrice != null
  const discountPct =
    showStrike && strikePrice && strikePrice > 0
      ? Math.round((1 - displayPrice / strikePrice) * 100)
      : 0

  const stockLabel = useMemo(() => {
    const n = activeVariant?.shopStock ?? product.stock ?? 0
    return n > 0 ? `${n} in stock` : 'Out of stock'
  }, [activeVariant?.shopStock, product.stock])

  /** Teaser only for long copy — full text lives in the section below. */
  const highlightBlurb = useMemo(() => {
    const raw = stripYouTubeUrlsFromText(product.description?.trim() ?? '')
    if (!raw || raw.length <= 160) return null
    const oneLine = raw.replace(/\s+/g, ' ')
    return `${oneLine.slice(0, 157).trimEnd()}…`
  }, [product.description])

  return (
    <section className="flex-1 space-y-5 sm:space-y-6">
      {/* Title + brand + social proof */}
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug tracking-tight">
          {product.name}
        </h1>

        {product.brandName ? (
          <p className="text-sm text-gray-500">
            Brand:{' '}
            <span className="font-medium text-[var(--dni-primary)]">{product.brandName}</span>
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--dni-primary)] tracking-tight" aria-hidden>
              ★★★★★
            </span>
            <span className="font-semibold text-[var(--dni-primary)]">4.9</span>
            <span className="text-gray-500">(11.8k ratings)</span>
          </div>
          <span className="hidden sm:inline h-3.5 w-px bg-gray-300" aria-hidden />
          <div>
            <span className="font-semibold text-gray-900">30k+</span> Sold
          </div>
        </div>
      </div>

      {/* Flash Deals pricing card */}
      <div className="overflow-hidden border border-[var(--dni-primary-100)] shadow-sm">
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5 text-white"
          style={{
            background: 'linear-gradient(90deg, var(--dni-primary-600), var(--dni-primary-500))',
          }}
        >
          <div className="flex items-center gap-2 font-semibold text-sm tracking-wide">
            <span className="text-lg leading-none" aria-hidden>
              ⚡
            </span>
            <span>FLASH DEALS</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="opacity-90 font-medium">ENDS IN</span>
            <div className="flex gap-1" aria-live="polite">
              {[countdown.h, countdown.m, countdown.s].map((t, i) => (
                <span
                  key={i}
                  className="min-w-[1.75rem] rounded-md bg-gray-900 px-1.5 py-0.5 text-center text-xs font-bold tabular-nums"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[var(--dni-primary-50)] to-white px-4 py-4 sm:py-5">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <span className="text-2xl sm:text-3xl font-bold text-[var(--dni-primary-700)] tracking-tight">
              {formatMoney(displayPrice, STORE_CURRENCY)}
            </span>
            {product.variants.length > 1 && product.minPrice !== product.maxPrice && (
              <span className="text-xs text-gray-500">Selected option</span>
            )}
            {showStrike && strikePrice != null && (
              <span className="text-sm sm:text-base text-gray-400 line-through">
                {formatMoney(strikePrice, STORE_CURRENCY)}
              </span>
            )}
            {discountPct > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                Save {discountPct}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Trust badges — horizontal row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
        <div className="flex items-start gap-3">
          <TrustIconCircle>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7h11v8H3V7zm11 3h4l3 3v2h-7v-5zM6.5 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
              />
            </svg>
          </TrustIconCircle>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Standard delivery</p>
            <p className="text-xs text-gray-500 leading-snug mt-0.5">Fee shown at checkout</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <TrustIconCircle>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.8 1.8L14.8 10" />
            </svg>
          </TrustIconCircle>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">100% Authentic</p>
            <p className="text-xs text-gray-500 leading-snug mt-0.5">Fulfilled by seller</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <TrustIconCircle>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 12a8 8 0 0113.5-5.8M20 12a8 8 0 01-13.5 5.8"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 3.5V6.5H14.5M6.5 20.5V17.5H9.5" />
            </svg>
          </TrustIconCircle>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">15-Day Free Returns</p>
            <p className="text-xs text-gray-500 leading-snug mt-0.5">Hassle-free exchanges</p>
          </div>
        </div>
      </div>

      {/* Feature highlight */}
      {highlightBlurb ? (
        <div className="border border-[var(--dni-primary-100)] bg-[var(--dni-primary-50)]/80 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2 text-[var(--dni-primary-700)]">
            <span className="text-base leading-none" aria-hidden>
              ⚡
            </span>
            <h2 className="text-sm font-semibold">Smart & Convenient</h2>
          </div>
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{highlightBlurb}</p>
        </div>
      ) : null}

      <ProductVariantSelector
        productId={product.id}
        variants={product.variants}
        thumbnailUrl={productServiceAssetUrl(product.images[0])}
        getVariantThumbnail={(v) => getGalleryImagesForVariant(product.images, v)[0]}
        onVariantChange={handleVariantChange}
      />

      <p className="text-xs text-gray-600">
        <span className="font-medium text-gray-800">Stock: </span>
        {stockLabel}
      </p>

      <ProductActions product={product} selectedVariant={activeVariant} />
    </section>
  )
}

export default ProductInfo
