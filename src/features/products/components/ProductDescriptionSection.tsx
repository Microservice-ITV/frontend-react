import type { ProductDetail } from '@/features/products/types/productTypes'
import { useMemo, useState } from 'react'
import {
  findYouTubeUrlInText,
  stripYouTubeUrlsFromText,
  toYouTubeEmbedSrc,
} from '@/features/products/utils/videoEmbed'

const COLLAPSED_CHARS = 480

type Props = {
  product: ProductDetail
}

/**
 * Row under the buy panel: description (left) + YouTube video (right).
 * URL from `product.videoUrl`, or the first YouTube link in the description.
 */
const ProductDescriptionSection = ({ product }: Props) => {
  const [expanded, setExpanded] = useState(false)

  const { displayText, embedSrc } = useMemo(() => {
    const raw = product.description?.trim() ?? ''
    const fromField = product.videoUrl?.trim() || null
    const fromText = fromField ? null : findYouTubeUrlInText(raw)
    const videoUrl = fromField || fromText
    const embed = videoUrl ? toYouTubeEmbedSrc(videoUrl) : null
    const display = fromText ? stripYouTubeUrlsFromText(raw) : raw
    return { displayText: display, embedSrc: embed }
  }, [product.description, product.videoUrl])

  const needsCollapse = displayText.length > COLLAPSED_CHARS
  const shown =
    !displayText
      ? ''
      : !needsCollapse || expanded
        ? displayText
        : `${displayText.slice(0, COLLAPSED_CHARS).trimEnd()}…`

  return (
    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch">
      <section className="min-w-0 flex-1 bg-white rounded-sm p-4 sm:p-6 w-full">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <span className="h-5 w-1 rounded-full bg-[var(--dni-primary)]" aria-hidden />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Product Description
          </h2>
        </div>

        {displayText ? (
          <>
            <div className="text-sm sm:text-[15px] text-gray-700 whitespace-pre-wrap leading-relaxed">
              {shown}
            </div>
            {needsCollapse ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-3 text-sm font-medium text-[var(--dni-primary)] hover:text-[var(--dni-primary-hover)] transition cursor-pointer"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            ) : null}
          </>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {product.brandName ? (
              <div>
                <dt className="text-gray-500">Brand</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{product.brandName}</dd>
              </div>
            ) : null}
            {product.category?.name ? (
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{product.category.name}</dd>
              </div>
            ) : null}
            {product.sku ? (
              <div>
                <dt className="text-gray-500">SKU</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{product.sku}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-gray-500">Shop</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{product.shop.name}</dd>
            </div>
          </dl>
        )}
      </section>

      <aside className="w-full lg:w-[360px] xl:w-[400px] flex-shrink-0">
        <div className="h-full bg-white rounded-sm p-4 sm:p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-5 w-1 rounded-full bg-[var(--dni-primary)]" aria-hidden />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">YouTube Video</h2>
          </div>

          {embedSrc ? (
            <div className="overflow-hidden rounded-xl bg-black aspect-video">
              <iframe
                src={embedSrc}
                title={`${product.name} YouTube video`}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600 shadow-sm"
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                  <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.5 31.5 0 0024 12a31.5 31.5 0 00-.5-5.8zM9.8 15.5v-7l6.3 3.5-6.3 3.5z" />
                </svg>
              </span>
              <p className="text-sm font-medium text-gray-700">No YouTube video yet</p>
              <p className="text-xs text-gray-500 max-w-[14rem] leading-relaxed">
                Paste a YouTube link in the product description (or set videoUrl) to play it here.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

export default ProductDescriptionSection
