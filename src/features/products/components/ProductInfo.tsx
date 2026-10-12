import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import ProductActions from './ProductActions'
import ProductVariantSelector, { pickDefaultVariant } from './ProductVariantSelector'
import type { ProductDetail, ProductFlashDeal, ProductVariant } from '@/features/products/types/productTypes'
import { getGalleryImagesForVariant } from '@/features/products/utils/variantGallery'
import { formatKsPrice } from '@/features/products/utils/formatProductPrice'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { toggleWishlist } from '@/features/wishlist/store/wishlistSlice'
import { selectIsWishlisted } from '@/features/wishlist/store/wishlistSelectors'
import { Store } from 'lucide-react'
import { SlidingNumber } from '@/features/flash-deals/components/FlashDealCountdown'

interface Props {
  product: ProductDetail
  /** Fired when the active SKU changes (including initial default) — drives variant-specific gallery. */
  onSelectedVariantChange?: (variant: ProductVariant | null) => void
}

function formatMoney(n: number, currency?: string) {
  return formatKsPrice(n, currency)
}

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, '0')
}

type CountdownParts = {
  d: number
  h: string
  m: string
  s: string
  expired: boolean
}

function splitRemaining(ms: number): CountdownParts {
  const totalSec = Math.floor(Math.max(0, ms) / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return { d, h: pad2(h), m: pad2(m), s: pad2(s), expired: ms <= 0 }
}

const expiredCountdown: CountdownParts = { d: 0, h: '00', m: '00', s: '00', expired: true }

/** Countdown to a flash deal's `endAt`. Idle when there is no live deal. */
function useDealCountdown(endAt: string | null) {
  const [parts, setParts] = useState<CountdownParts>(() => {
    if (!endAt) return expiredCountdown
    const end = new Date(endAt).getTime()
    if (!Number.isFinite(end)) return expiredCountdown
    return splitRemaining(end - Date.now())
  })

  useEffect(() => {
    if (!endAt) {
      setParts(expiredCountdown)
      return
    }
    const end = new Date(endAt).getTime()
    if (!Number.isFinite(end)) {
      setParts(expiredCountdown)
      return
    }
    const tick = () => setParts(splitRemaining(end - Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [endAt])

  return parts
}

/** Variant-specific deal wins; a deal with no variant applies to every SKU. */
function pickFlashDeal(
  deals: ProductFlashDeal[] | undefined,
  variantId: string | null,
): ProductFlashDeal | null {
  if (!deals?.length) return null
  if (variantId) {
    const variantMatch = deals.find((deal) => deal.variantId === variantId)
    if (variantMatch) return variantMatch
  }
  return deals.find((deal) => !deal.variantId) ?? null
}

function PriceRow({
  displayPrice,
  strikePrice,
  discountPct,
  optionHint,
  emphasis = false,
}: {
  displayPrice: number
  strikePrice: number | null
  discountPct: number
  optionHint: boolean
  emphasis?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
      <span
        className={`text-2xl sm:text-3xl font-bold tracking-tight ${
          emphasis ? 'text-[var(--dni-primary-700)]' : 'text-gray-900'
        }`}
      >
        {formatMoney(displayPrice)}
      </span>
      {optionHint && <span className="text-xs text-gray-500">Selected option</span>}
      {strikePrice != null && (
        <span className="text-sm sm:text-base text-gray-400 line-through">
          {formatMoney(strikePrice)}
        </span>
      )}
      {discountPct > 0 && (
        <span className="inline-flex items-center rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
          Save {discountPct}%
        </span>
      )}
    </div>
  )
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
  const dispatch = useAppDispatch()
  const wishlisted = useAppSelector((s) => selectIsWishlisted(s, product.id))
  const [activeVariant, setActiveVariant] = useState<ProductVariant | null>(null)
  const selectedVariantId =
    activeVariant?.variantId ?? pickDefaultVariant(product.variants)?.variantId ?? null
  const matchedDeal = useMemo(
    () => pickFlashDeal(product.flashDeals, selectedVariantId),
    [product.flashDeals, selectedVariantId],
  )
  const countdown = useDealCountdown(matchedDeal?.endAt ?? null)
  const flashDeal = matchedDeal && !countdown.expired ? matchedDeal : null

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

  const catalogPrice = activeVariant?.price ?? product.price
  const displayPrice = flashDeal ? flashDeal.dealPrice : catalogPrice

  /** Strikethrough and “Save %” only when a live flash deal sets a higher original price. */
  const strikePrice =
    flashDeal && flashDeal.originalPrice > displayPrice + 0.001 ? flashDeal.originalPrice : null
  const discountPct =
    flashDeal == null
      ? 0
      : flashDeal.discount > 0
        ? flashDeal.discount
        : strikePrice != null && strikePrice > 0
          ? Math.round((1 - displayPrice / strikePrice) * 100)
          : 0

  const stockLabel = useMemo(() => {
    const n = activeVariant?.shopStock ?? product.stock ?? 0
    return n > 0 ? `${n} in stock` : 'Out of stock'
  }, [activeVariant?.shopStock, product.stock])

  const handleWishlist = useCallback(() => {
    dispatch(toggleWishlist(product.id))
  }, [dispatch, product.id])

  return (
    <section className="flex-1 space-y-5 sm:space-y-6">
      {/* Title + brand + social proof */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug tracking-tight">
            {product.name}
          </h1>

          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="
              mt-0.5 inline-flex h-10 w-10 items-center justify-center
              border border-black/10 bg-white text-gray-600
              transition-colors duration-200
              hover:border-[var(--dni-primary)] hover:text-[var(--dni-primary)]
            "
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-5 w-5 origin-center transition-all duration-200 ease-out ${
                wishlisted
                  ? 'fill-[#ef4444] text-[#ef4444] scale-110'
                  : 'fill-none stroke-current scale-100'
              }`}
              strokeWidth={wishlisted ? 0 : 1.8}
              aria-hidden
            >
              <path d="M12 21s-6.5-4.35-9.2-8.1C1.1 10.5 1.4 7.4 3.7 5.7c2-1.5 4.7-1.1 6.2.7L12 8.3l2.1-1.9c1.5-1.8 4.2-2.2 6.2-.7 2.3 1.7 2.6 4.8.9 7.2C18.5 16.65 12 21 12 21z" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          {product.shop?.id && product.shop?.name ? (
            <Link
              to={`/shops/${product.shop.id}`}
              className="inline-flex items-center gap-1.5 hover:text-[var(--dni-primary)] transition-colors"
              aria-label={`View shop ${product.shop.name}`}
            >
              <Store size={16} className="text-[var(--dni-primary)]" />
              <span className="text-gray-500">Shop:</span>
              <span className="font-semibold text-gray-900">{product.shop.name}</span>
            </Link>
          ) : null}

          {product.brandName ? (
            <span className="text-gray-500">
              Brand:{' '}
              <span className="font-medium text-[var(--dni-primary)]">{product.brandName}</span>
            </span>
          ) : null}
        </div>

        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

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

      {flashDeal ? (
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
                {(countdown.d > 0
                  ? [pad2(countdown.d), countdown.h, countdown.m, countdown.s]
                  : [countdown.h, countdown.m, countdown.s]
                ).map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md bg-gray-900 px-1.5 py-0.5 text-center text-xs font-bold tabular-nums"
                  >
                    <SlidingNumber value={t} />
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[var(--dni-primary-50)] to-white px-4 py-4 sm:py-5">
            <PriceRow
              displayPrice={displayPrice}
              strikePrice={strikePrice}
              discountPct={discountPct}
              optionHint={product.variants.length > 1 && product.minPrice !== product.maxPrice}
              emphasis
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5 border border-[var(--dni-primary-100)] bg-[var(--dni-primary-50)]/70 px-4 py-4 sm:gap-3 sm:py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Price</p>
          <PriceRow
            displayPrice={displayPrice}
            strikePrice={strikePrice}
            discountPct={discountPct}
            optionHint={product.variants.length > 1 && product.minPrice !== product.maxPrice}
          />
        </div>
      )}

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

      <ProductVariantSelector
        productId={product.id}
        variants={product.variants}
        thumbnailUrl={productServiceAssetUrl(product.images[0])}
        getVariantThumbnail={(v) => getGalleryImagesForVariant(product.images, v)[0]}
        onVariantChange={handleVariantChange}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className="w-20 shrink-0 text-sm font-medium text-gray-900 sm:w-24">Stock:</span>
        <p className="text-sm text-gray-600">{stockLabel}</p>
      </div>

      <ProductActions
        product={product}
        selectedVariant={activeVariant}
        promoPrice={flashDeal ? flashDeal.dealPrice : null}
        flashDealId={flashDeal?.flashDealId}
        flashDealItemId={flashDeal?.flashDealItemId}
        originalPrice={flashDeal?.originalPrice}
      />
    </section>
  )
}

export default ProductInfo
