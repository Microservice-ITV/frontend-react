import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import clsx from 'clsx'

export type ModalDrawerVariant = 'modal' | 'drawer'
export type ModalDrawerSize = 'sm' | 'md' | 'lg' | 'xl'

export type ModalDrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  variant?: ModalDrawerVariant
  size?: ModalDrawerSize
  /** Extra classes for the drawer panel (drawer variant only). */
  panelClassName?: string
  closeOnBackdrop?: boolean
  hideClose?: boolean
  /** Size the dialog to its content instead of the viewport height. */
  fitContent?: boolean
}

const MODAL_SIZE_CLASSES: Record<ModalDrawerSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

const DRAWER_WIDTH_CLASSES: Record<ModalDrawerSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
}

const ModalDrawer = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = 'modal',
  size = 'md',
  panelClassName,
  closeOnBackdrop = true,
  hideClose = false,
  fitContent = false,
}: ModalDrawerProps) => {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const frame = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(frame)
    }
    setShown(false)
    const timer = setTimeout(() => setMounted(false), 200)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!mounted) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [mounted, onClose])

  if (!mounted) return null

  const isDrawer = variant === 'drawer'

  return createPortal(
    <div
      className={clsx(
        'fixed inset-0 z-50 flex',
        isDrawer ? 'justify-end' : 'items-center justify-center p-4',
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={closeOnBackdrop ? onClose : undefined}
        className={clsx(
          'absolute inset-0 bg-slate-900/40 transition-opacity duration-200',
          shown ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        className={clsx(
          'relative flex w-full flex-col bg-white shadow-xl transition-all duration-200',
          isDrawer
            ? clsx(
                'h-full border-l border-slate-200',
                DRAWER_WIDTH_CLASSES[size],
                shown ? 'translate-x-0' : 'translate-x-full',
                panelClassName,
              )
            : clsx(
                'max-h-[90vh] rounded-xl border border-slate-200',
                fitContent ? 'h-auto overflow-hidden' : 'h-full',
                MODAL_SIZE_CLASSES[size],
                shown ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
                panelClassName,
              ),
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--dni-border)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>
            )}
          </div>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div
          className={clsx(
            'px-5 py-4',
            fitContent && !isDrawer
              ? 'max-h-[calc(90vh-8rem)] overflow-y-auto'
              : 'min-h-0 flex-1 overflow-y-auto',
          )}
        >
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-[var(--dni-border)] px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default ModalDrawer
