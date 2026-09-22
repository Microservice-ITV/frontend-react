import { useEffect, useState } from 'react'

/**
 * Returns `value` after it has stayed unchanged for `delayMs`.
 * Used to keep server-side lookups (searchable selects) from firing on every keystroke.
 */
export const useDebouncedValue = <T,>(value: T, delayMs = 350): T => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
}

export default useDebouncedValue
