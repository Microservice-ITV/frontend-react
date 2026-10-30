import type { SyntheticEvent } from 'react'
import {
  productImageSrcSet,
  productImageVariantUrl,
  type ProductImageVariant,
} from '@/lib/api/apiConfig'

type ResponsiveAssetImageProps = {
  src?: string | null
  alt: string
  className?: string
  /** Default file when srcset is unavailable or as the img src fallback. */
  variant?: ProductImageVariant
  /** CSS sizes hint so the browser picks thumb vs card vs full. */
  sizes?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  decoding?: 'async' | 'auto' | 'sync'
  width?: number
  height?: number
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void
}

/**
 * Serves the right WebP size from product-service multi-size uploads
 * (`-thumb` / `-card` / `-full`). Legacy single-file URLs still work.
 */
export default function ResponsiveAssetImage({
  src,
  alt,
  className,
  variant = 'card',
  sizes = '(max-width: 640px) 50vw, 300px',
  loading = 'lazy',
  fetchPriority,
  decoding = 'async',
  width,
  height,
  onError,
}: ResponsiveAssetImageProps) {
  const resolved = productImageVariantUrl(src, variant)
  const srcSet = productImageSrcSet(src)

  if (!resolved) return null

  return (
    <img
      src={resolved}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding={decoding}
      width={width}
      height={height}
      onError={onError}
    />
  )
}
