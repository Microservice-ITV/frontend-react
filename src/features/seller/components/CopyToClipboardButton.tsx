import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Check, Clipboard, TriangleAlert } from 'lucide-react'

type CopyState = 'idle' | 'copied' | 'failed'

type CopyToClipboardButtonProps = {
  value: string
  label: string
}

const copyText = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()
  if (!copied) throw new Error('Clipboard copy failed')
}

const CopyToClipboardButton = ({ value, label }: CopyToClipboardButtonProps) => {
  const [state, setState] = useState<CopyState>('idle')
  const timeoutRef = useRef<number | null>(null)
  const canCopy = value.trim().length > 0

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
  }, [])

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (!canCopy) return

    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    try {
      await copyText(value)
      setState('copied')
    } catch {
      setState('failed')
    }
    timeoutRef.current = window.setTimeout(() => setState('idle'), 1600)
  }

  const accessibleLabel = state === 'copied'
    ? `${label} copied`
    : state === 'failed'
      ? `Unable to copy ${label}`
      : `Copy ${label}`

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!canCopy}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      className="inline-flex shrink-0 items-center justify-center rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {state === 'copied'
        ? <Check size={14} className="text-emerald-600" aria-hidden="true" />
        : state === 'failed'
          ? <TriangleAlert size={14} className="text-rose-600" aria-hidden="true" />
          : <Clipboard size={14} aria-hidden="true" />}
    </button>
  )
}

export default CopyToClipboardButton
