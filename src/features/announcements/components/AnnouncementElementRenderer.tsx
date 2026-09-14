import type { AnnouncementElementType } from '../types/announcementTypes'

interface AnnouncementElementRendererProps {
  elementType: AnnouncementElementType
  text: string | null
  textColor?: string | null
  backgroundColor?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const TEXT_SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
}

const PADDING_SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-2 py-0.5',
  md: 'px-3 py-1',
  lg: 'px-4 py-2',
}

export function AnnouncementElementRenderer({
  elementType,
  text,
  textColor,
  backgroundColor,
  size = 'md',
}: AnnouncementElementRendererProps) {
  const textSize = TEXT_SIZES[size]
  const padding = PADDING_SIZES[size]
  const inlineStyle = {
    color: textColor ?? undefined,
    backgroundColor: backgroundColor ?? undefined,
  }

  switch (elementType) {
    case 'BUTTON':
      return (
        <span
          className={`inline-flex items-center rounded-lg font-semibold ${textSize} ${padding}`}
          style={inlineStyle}
        >
          {text?.trim() || 'Button'}
        </span>
      )
    case 'LABEL':
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium ${textSize} ${padding}`}
          style={inlineStyle}
        >
          {text?.trim() || 'Label'}
        </span>
      )
    case 'ICON':
      return (
        <span
          className={`inline-flex h-7 w-7 items-center justify-center font-semibold ${textSize}`}
          style={inlineStyle}
        >
          {text?.trim() || '\u2726'}
        </span>
      )
    case 'IMAGE':
      return (
        <span
          className={`inline-flex items-center rounded-md bg-slate-200 font-medium text-slate-500 ${textSize} ${padding}`}
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          {text?.trim() || 'Image'}
        </span>
      )
    case 'DIVIDER':
      return <span className="mx-1 inline-block h-4 w-px bg-current opacity-40" aria-hidden />
    case 'TEXT':
    default:
      return (
        <span className={`font-semibold ${textSize}`} style={inlineStyle}>
          {text?.trim() || 'Text'}
        </span>
      )
  }
}