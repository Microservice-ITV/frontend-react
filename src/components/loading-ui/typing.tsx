import type { ComponentProps } from 'react'
import clsx from 'clsx'

type TypingProps = ComponentProps<'span'> & {
  dots?: number
}

export function Typing({ className, dots = 3, ...props }: TypingProps) {
  return (
    <span
      role="status"
      className={clsx(
        'inline-flex items-center gap-[12%] text-[var(--dni-primary)]',
        className,
      )}
      {...props}
    >
      {Array.from({ length: dots }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="loading-ui-typing-dot inline-block aspect-square grow rounded-full bg-current"
          style={{
            animation: 'loading-ui-typing var(--duration, 1s) infinite',
            animationDelay: `calc(var(--delay, 160ms) * ${index})`,
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </span>
  )
}
