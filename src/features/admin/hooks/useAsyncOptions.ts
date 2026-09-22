import { useEffect, useRef, useState } from 'react'
import type { SearchableSelectOption } from '@/components/ui/SearchableSelect'
import type { AdminLookupStatus } from '../types/userTypes'

export type UseAsyncOptionsResult = {
  options: SearchableSelectOption[]
  status: AdminLookupStatus
  error: string | null
}

/**
 * Loads dropdown options from a paginated API endpoint.
 *
 * `query` is expected to be debounced by the caller. The loader is read through a
 * ref so callers don't need to memoize it — options are only re-fetched when the
 * query (or `enabled`) changes.
 */
export const useAsyncOptions = (
  query: string,
  load: (query: string) => Promise<SearchableSelectOption[]>,
  enabled = true,
): UseAsyncOptionsResult => {
  const loadRef = useRef(load)

  const [options, setOptions] = useState<SearchableSelectOption[]>([])
  const [status, setStatus] = useState<AdminLookupStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRef.current = load
  }, [load])

  useEffect(() => {
    if (!enabled) {
      setOptions([])
      setError(null)
      setStatus('idle')
      return
    }

    let cancelled = false
    setStatus('loading')
    setError(null)

    loadRef
      .current(query)
      .then((nextOptions) => {
        if (cancelled) return
        setOptions(nextOptions)
        setStatus('succeeded')
      })
      .catch((loadError: unknown) => {
        if (cancelled) return
        setOptions([])
        setError(loadError instanceof Error ? loadError.message : 'Unable to load options.')
        setStatus('failed')
      })

    return () => {
      cancelled = true
    }
  }, [query, enabled])

  return { options, status, error }
}

export default useAsyncOptions