import { useEffect, useState } from 'react'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
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
  const resolved = productServiceAssetUrl(imageUrl)
  const [src, setSrc] = useState(resolved || placeholderImage)

  useEffect(() => {
    setSrc(resolved || placeholderImage)
  }, [resolved])

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setSrc(placeholderImage)}
      className={`${className} shrink-0 rounded-sm border border-gray-100 bg-gray-100 object-cover`}
    />
  )
}

export default OrderProductImage
