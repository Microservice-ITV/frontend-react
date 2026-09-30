import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'

export type RowActionMenuItem = {
  key: string
  label: string
  icon?: ReactNode
  onClick: () => void
  className?: string
}

type RowActionMenuProps = {
  items: RowActionMenuItem[]
  ariaLabel?: string
}

const MENU_WIDTH = 160
const ITEM_HEIGHT = 36
const MENU_PADDING = 8

const RowActionMenu = ({ items, ariaLabel = 'Actions' }: RowActionMenuProps) => {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = () => {
    setOpen(false)
    setPosition(null)
  }

  const toggle = () => {
    if (open) {
      close()
      return
    }
    const button = buttonRef.current
    if (!button) return

    const menuHeight = items.length * ITEM_HEIGHT + MENU_PADDING
    const rect = button.getBoundingClientRect()
    const openUpward = window.innerHeight - rect.bottom < menuHeight + 8
    const top = openUpward ? rect.top - menuHeight - 4 : rect.bottom + 4
    const left = Math.min(
      Math.max(8, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - 8,
    )

    setPosition({ top, left })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return
      }
      close()
    }
    const handleRepositionClose = () => close()

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleRepositionClose)
    window.addEventListener('scroll', handleRepositionClose, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleRepositionClose)
      window.removeEventListener('scroll', handleRepositionClose, true)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        <MoreHorizontal size={18} />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            className="fixed z-[100] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  close()
                  item.onClick()
                }}
                className={
                  item.className ??
                  'flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer'
                }
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}

export default RowActionMenu