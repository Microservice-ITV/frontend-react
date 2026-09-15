import { AnnouncementElementRenderer } from './AnnouncementElementRenderer'

import type { AnnouncementDisplayElement } from '../types/announcementTypes'

interface AnnouncementRendererProps {
  typeName?: string | null
  elements: AnnouncementDisplayElement[]
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Renders a full announcement as it would appear on the homepage bar.
 * Designed to be reused for the live preview and, later, customer-facing
 * homepage wiring (it consumes the same `/announcements/active` payload shape).
 */
export function AnnouncementRenderer({
  typeName,
  elements,
  size = 'md',
  className = '',
}: AnnouncementRendererProps) {
  if (!elements.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs italic text-slate-400">
        No announcement elements to preview yet.
      </p>
    )
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 ${className}`}
    >
      {typeName && (
        <span className="mr-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {typeName}
        </span>
      )}
      {elements.map((element) => (
        <AnnouncementElementRenderer
          key={element.key}
          elementType={element.elementType}
          text={element.text}
          textColor={element.textColor}
          backgroundColor={element.backgroundColor}
          size={size}
        />
      ))}
    </div>
  )
}