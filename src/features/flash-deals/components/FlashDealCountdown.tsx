import { useEffect, useRef, useState } from 'react'

const pad = (value: number) => String(Math.max(0, value)).padStart(2, '0')

const UNITS = [
  { key: 'hr', label: 'hrs' },
  { key: 'min', label: 'min' },
  { key: 'sec', label: 'sec' },
] as const

interface FlashDealCountdownProps {
  hours: number
  minutes: number
  seconds: number
  label?: string
}

const SLIDE_MS = 320

/** One digit window. The old digit slides up and out; the new digit slides up into place. */
function DigitRoller({ digit }: { digit: string }) {
  const shownRef = useRef(digit)
  const [top, setTop] = useState(digit)
  const [bottom, setBottom] = useState(digit)
  const [rolling, setRolling] = useState(false)

  useEffect(() => {
    if (digit === shownRef.current) return
    const previous = shownRef.current
    setTop(previous)
    setBottom(digit)
    setRolling(false)

    let timeoutId = 0
    const frame = window.requestAnimationFrame(() => {
      setRolling(true)
      timeoutId = window.setTimeout(() => {
        shownRef.current = digit
        setTop(digit)
        setBottom(digit)
        setRolling(false)
      }, SLIDE_MS)
    })

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timeoutId)
    }
  }, [digit])

  return (
    <span className="relative inline-block h-[1em] w-[0.72em] overflow-hidden align-middle">
      <span
        className="absolute inset-x-0 top-0 flex flex-col motion-reduce:transition-none"
        style={{
          transform: rolling ? 'translateY(-50%)' : 'translateY(0)',
          transition: rolling ? `transform ${SLIDE_MS}ms cubic-bezier(0.33, 1, 0.68, 1)` : 'none',
        }}
      >
        <span className="flex h-[1em] items-center justify-center">{top}</span>
        <span className="flex h-[1em] items-center justify-center">{bottom}</span>
      </span>
    </span>
  )
}

export function SlidingNumber({ value }: { value: string }) {
  return (
    <span className="inline-flex">
      {value.split('').map((digit, index) => (
        <DigitRoller key={index} digit={digit} />
      ))}
    </span>
  )
}

const FlashDealCountdown = ({ hours, minutes, seconds, label }: FlashDealCountdownProps) => {
  const values = [pad(hours), pad(minutes), pad(seconds)]

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2" aria-live="polite">
        {UNITS.map((unit, index) => (
          <span
            key={unit.key}
            className="inline-flex h-11 items-center gap-1 rounded-[3px] bg-[var(--dni-primary)] px-2.5 font-sans text-base font-bold tabular-nums text-white"
          >
            <SlidingNumber value={values[index]} />
            <span className="text-[11px] font-semibold tracking-wide text-white/80">
              {unit.label}
            </span>
          </span>
        ))}
      </div>
      {label ? (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      ) : null}
    </div>
  )
}

export default FlashDealCountdown
