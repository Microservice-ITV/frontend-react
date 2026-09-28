import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { formatDocumentTitle, resolvePageTitle } from '@/lib/pageTitle'

type PageTitleOverride = {
  pathname: string
  title: string
}

type PageTitleOverrideSetter = (override: PageTitleOverride | null) => void

const PageTitleOverrideContext = createContext<PageTitleOverrideSetter | null>(null)

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation()
  const [override, setOverride] = useState<PageTitleOverride | null>(null)
  const activeOverride = override?.pathname === pathname ? override.title : null

  useLayoutEffect(() => {
    document.title = formatDocumentTitle(activeOverride ?? resolvePageTitle(pathname, search))
  }, [activeOverride, pathname, search])

  return (
    <PageTitleOverrideContext.Provider value={setOverride}>
      {children}
    </PageTitleOverrideContext.Provider>
  )
}

/** Replace the route title while this page is mounted. Pass a name once it has loaded. */
export function usePageTitle(pageTitle?: string | null) {
  const setOverride = useContext(PageTitleOverrideContext)
  const { pathname } = useLocation()

  useEffect(() => {
    if (!setOverride) return

    const trimmed = pageTitle?.trim()
    if (!trimmed) {
      setOverride(null)
      return
    }

    setOverride({ pathname, title: trimmed })
    return () => setOverride(null)
  }, [pageTitle, pathname, setOverride])
}
