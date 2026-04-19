import { useCallback, useEffect, useMemo, useState } from 'react'
import ProductActions from './ProductActions'
import ProductVariantSelector, { pickDefaultVariant } from './ProductVariantSelector'
import { deliveryIcon, guaranteeIcon } from '@/assets/icons'
import type { ProductDetail, ProductVariant } from '@/features/products/types/productTypes'
import { getGalleryImagesForVariant } from '@/features/products/utils/variantGallery'

interface Props {
  product: ProductDetail
  /** Fired when the active SKU changes (including initial default) — drives variant-specific gallery. */
  onSelectedVariantChange?: (variant: ProductVariant | null) => void
}

function formatMoney(n: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(n)
  } catch {
    return `$${n.toFixed(2)}`
  }
}

const ProductInfo = ({ product, onSelectedVariantChange }: Props) => {
  const [activeVariant, setActiveVariant] = useState<ProductVariant | null>(null)

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

  const priceTitle = useMemo(() => {
    if (product.variants.length <= 1) {
      return formatMoney(displayPrice, product.currency)
    }
    if (product.minPrice !== product.maxPrice) {
      return `${formatMoney(product.minPrice, product.currency)} – ${formatMoney(product.maxPrice, product.currency)}`
    }
    return formatMoney(displayPrice, product.currency)
  }, [product.currency, product.maxPrice, product.minPrice, product.variants.length, displayPrice])

  return (
    <section className="flex-1 space-y-4 sm:space-y-5">
      <h1 className="text-lg sm:text-xl font-medium text-gray-900">{product.name}</h1>

      {product.brandName ? (
        <p className="text-xs text-gray-500">
          Brand: <span className="text-gray-800">{product.brandName}</span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <span className="text-[var(--dni-primary)] font-medium">4.9</span>
          <span className="text-[var(--dni-primary)]">★★★★★</span>
        </div>
        <div>
          <span className="font-medium text-gray-900">11.8k</span> ratings
        </div>
        <div>
          <span className="font-medium text-gray-900">30k+</span> Sold
        </div>
      </div>

      <div className="border border-[#f5f5f5]">
        <div
          className="flex items-center justify-between px-3 sm:px-4 py-2 text-white"
          style={{
            background: 'linear-gradient(to right, var(--dni-primary), var(--dni-primary-500))',
          }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm">
            <span className="text-base sm:text-lg">⚡</span>
            <span>FLASH DEALS</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <span className="opacity-90 hidden sm:inline">ENDS IN</span>
            <div className="flex gap-0.5 sm:gap-1">
              {['00', '00', '00'].map((t, i) => (
                <span key={i} className="bg-black px-1 sm:px-1.5 py-0.5 rounded text-xs font-bold">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          className="px-3 sm:px-4 py-3 sm:py-4"
          style={{
            background: 'linear-gradient(to left, #fff5f5, #ffffff)',
          }}
        >
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl lg:text-3xl font-semibold text-emerald-700">
              {product.variants.length > 1 ? formatMoney(displayPrice, product.currency) : priceTitle}
            </span>
            {product.variants.length > 1 && product.minPrice !== product.maxPrice && (
              <span className="text-xs text-gray-500">Selected option</span>
            )}
            {showStrike && strikePrice != null && (
              <span className="text-sm sm:text-base text-gray-400 line-through">
                {formatMoney(strikePrice, product.currency)}
              </span>
            )}
            {discountPct > 0 && (
              <span className="text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                -{discountPct}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm">
        <span className="w-20 sm:w-28 text-gray-500 flex-shrink-0">Shipping</span>
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <img src={deliveryIcon} alt="" className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-gray-900">
                Standard delivery · fee shown at checkout
              </p>
              <p className="text-gray-500">Free shipping on eligible orders where available.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm">
        <span className="w-20 sm:w-28 text-gray-500 flex-shrink-0">Shopping Guarantee</span>
        <div className="flex items-start gap-2 text-gray-900">
          <img src={guaranteeIcon} alt="" className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>100% Authentic · Fulfilled by seller · 15-Day Free Returns</span>
        </div>
      </div>

      <ProductVariantSelector
        productId={product.id}
        variants={product.variants}
        thumbnailUrl={product.images[0]}
        getVariantThumbnail={(v) => getGalleryImagesForVariant(product.images, v)[0]}
        onVariantChange={handleVariantChange}
      />

      <p className="text-xs text-gray-600">
        <span className="font-medium text-gray-800">Stock: </span>
        {stockLabel}
      </p>

      <ProductActions product={product} selectedVariant={activeVariant} />

      {product.description?.trim() ? (
        <div className="border-t border-gray-100 pt-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Description</h2>
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {product.description}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ProductInfo