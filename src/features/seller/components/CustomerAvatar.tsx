import { useEffect, useState } from 'react'
import { User } from 'lucide-react'

type CustomerAvatarProps = {
  imageUrl?: string | null
  alt: string
  className?: string
}

const CustomerAvatar = ({
  imageUrl,
  alt,
  className = 'h-8 w-8',
}: CustomerAvatarProps) => {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [imageUrl])

  if (!imageUrl || failed) {
    return (
      <span
        className={`${className} flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400`}
        aria-label={alt}
      >
        <User className="h-1/2 w-1/2" strokeWidth={2} />
      </span>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      onError={() => setFailed(true)}
      className={`${className} shrink-0 rounded-full object-cover`}
    />
  )
}

export default CustomerAvatar
