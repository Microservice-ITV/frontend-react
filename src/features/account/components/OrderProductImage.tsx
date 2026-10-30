import { useEffect, useState } from 'react'
import {
  productImageSrcSet,
  productImageVariantUrl,
} from '@/lib/api/apiConfig'
import placeholderImage from '@/public/placeholder.svg'

type OrderProductImageProps = {
  imageUrl?: string | null
  alt: string
  className?: string
}

const OrderProductImage = ({
  imageUrl,
  alt,
  className = 'h-16 w-16',
}: OrderProductImageProps) => {
  const resolved = productImageVariantUrl(imageUrl, 'thumb')
  const srcSet = productImageSrcSet(imageUrl)
  const [src, setSrc] = useState(resolved || placeholderImage)
  const [useSrcSet, setUseSrcSet] = useState(Boolean(srcSet))

  useEffect(() => {
    setSrc(resolved || placeholderImage)
    setUseSrcSet(Boolean(srcSet))
  }, [resolved, srcSet])

  return (
    <img
      src={src}
      srcSet={useSrcSet && src !== placeholderImage ? srcSet : undefined}
      sizes="64px"
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => {
        setUseSrcSet(false)
        setSrc(placeholderImage)
      }}
      className={`${className} shrink-0 rounded-sm border border-gray-100 bg-gray-100 object-cover`}
    />
  )
}

export default OrderProductImage
