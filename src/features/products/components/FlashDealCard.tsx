import { Link } from 'react-router-dom'
import type { NormalisedFlashDealProduct } from '../types/flashDealTypes'

interface VoucherBadge {
  text: string
  color: string
}

interface FlashDealCardProps {
  product: NormalisedFlashDealProduct
  isOngoing: boolean
  voucherBadges?: VoucherBadge[]
}

export const FlashDealCard = ({ product, isOngoing, voucherBadges = [] }: FlashDealCardProps) => {
  const soldPercent = Math.min(
    product.totalStock > 0
      ? Math.round((product.soldCount / product.totalStock) * 100)
      : 0,
    100,
  )
  const isSoldOut = product.soldCount >= product.totalStock && product.totalStock > 0
  const remaining = Math.max(product.totalStock - product.soldCount, 0)
  const progressLabel = isSoldOut
    ? 'SOLD OUT'
    : remaining <= 10
      ? `ONLY ${remaining} LEFT`
      : 'SELLING FAST'

  return (
    <Link
      to={product.flashDealItemId
        ? `/products/${product.id}?flashDealItemId=${encodeURIComponent(product.flashDealItemId)}`
        : `/products/${product.id}`}
      className="block no-underline hover:no-underline"
      aria-label={`${product.name} - $${product.dealPrice.toFixed(2)}`}
    >
      <article className="flex h-full flex-col overflow-hidden rounded-sm border border-[var(--dni-border)] bg-white font-sans transition-all hover:-translate-y-0.5 hover:border-[var(--dni-primary)] hover:shadow-md">
        {/* IMAGE CONTAINER WITH OVERLAYS */}
        <div className="relative aspect-square w-full overflow-hidden bg-white">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* MALL BADGE - Top Left */}
          <span className="absolute left-1 top-1 z-10 rounded-sm bg-[var(--dni-primary)] px-1 text-[10px] font-semibold text-white">
            Mall
          </span>

          {/* VOUCHER BADGES - Bottom with dark gradient */}
          {voucherBadges.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-6 pb-1.5 px-1 z-10">
              <div className="flex flex-col items-center gap-1">
                {voucherBadges.map((badge, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center justify-center px-2 py-0.5 text-[9px] font-semibold rounded-sm ${badge.color} w-fit shadow-sm`}
                  >
                    {badge.text}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SOLD OUT OVERLAY */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <span className="px-3 py-1.5 bg-white text-red-600 text-[11px] font-semibold rounded">
                SOLD OUT
              </span>
            </div>
          )}
        </div>

        {/* CONTENT AREA */}
        <div className="flex flex-col justify-between flex-1 bg-white min-h-0 p-0.5">
          {/* PRODUCT TITLE */}
          <h3 className="text-xs text-[#202124] line-clamp-2 h-8 leading-snug font-medium px-2 mt-2 mb-1 no-underline hover:no-underline">
            {product.name}
          </h3>

          {/* PRICE BLOCK */}
          <div className="flex items-baseline px-2 mb-2">
            <span className="text-base font-semibold leading-tight text-[var(--dni-primary)]">
              ${product.dealPrice.toFixed(product.dealPrice % 1 === 0 ? 0 : 2)}
            </span>
            {product.originalPrice > product.dealPrice && (
              <span className="text-[#9aa0a6] text-xs line-through ml-1.5 leading-tight">
                ${product.originalPrice.toFixed(product.originalPrice % 1 === 0 ? 0 : 2)}
              </span>
            )}
          </div>

          {/* URGENCY PROGRESS BAR - Bottom of card */}
          <div className="relative mx-2 mb-3 flex h-4 items-center justify-center overflow-hidden rounded-full bg-[var(--dni-primary-100)]">
            <div
              className="absolute bottom-0 left-0 top-0 bg-[var(--dni-primary)] transition-all duration-500 ease-out"
              style={{ width: `${soldPercent}%` }}
              role="progressbar"
              aria-valuenow={soldPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${soldPercent}% claimed`}
            />
            <span className="text-[9px] font-bold text-white uppercase z-10 drop-shadow-sm">
              {isOngoing ? progressLabel : `${soldPercent}% CLAIMED`}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default FlashDealCard
