import { useEffect } from 'react'

const HEADER_VAR = '--site-header-height'

/** Keeps `--site-header-height` in sync with the sticky site header. */
export function useSiteHeaderHeight() {
  useEffect(() => {
    const header = document.getElementById('site-header')
    if (!header) return

    const sync = () => {
      document.documentElement.style.setProperty(
        HEADER_VAR,
        `${header.offsetHeight}px`,
      )
    }

    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(header)
    return () => {
      observer.disconnect()
    }
  }, [])
}
