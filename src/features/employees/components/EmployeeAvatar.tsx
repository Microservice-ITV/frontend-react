import { useEffect, useState } from 'react'

type EmployeeAvatarProps = {
  name: string
  imageUrl?: string | null
  className?: string
}

const initialsFor = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

const EmployeeAvatar = ({ name, imageUrl, className = '' }: EmployeeAvatarProps) => {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [imageUrl])

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt={`${name} profile`}
        onError={() => setImageFailed(true)}
        className={`h-full w-full rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <span
      aria-label={`${name} initials`}
      className={`flex h-full w-full items-center justify-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-800 ${className}`}
    >
      {initialsFor(name)}
    </span>
  )
}

export default EmployeeAvatar
