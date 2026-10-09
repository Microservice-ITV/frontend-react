import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div
      className={clsx(
        "rounded-sm bg-white shadow-sm border border-gray-200",
        className
      )}
    >
      {children}
    </div>
  )
}