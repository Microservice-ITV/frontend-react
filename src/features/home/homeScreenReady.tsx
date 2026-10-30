import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export const HOME_SCREEN_SECTIONS = [
  'banner',
  'quickActions',
  'categories',
  'flashDeals',
  'topOrdered',
  'recentlyAdded',
] as const

/** First viewport only — splash clears when these settle; lower sections load after paint. */
const HOME_ABOVE_FOLD_SECTIONS = ['banner', 'quickActions'] as const

export type HomeScreenSection = (typeof HOME_SCREEN_SECTIONS)[number]

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

type HomeScreenReadyContextValue = {
  report: (section: HomeScreenSection, ready: boolean) => void
}

const HomeScreenReadyContext = createContext<HomeScreenReadyContextValue | null>(null)

type HomeScreenReadyProviderProps = {
  children: ReactNode
  onReadyChange: (ready: boolean) => void
}

export const isRequestSettled = (status: RequestStatus) =>
  status === 'succeeded' || status === 'failed'

export function HomeScreenReadyProvider({
  children,
  onReadyChange,
}: HomeScreenReadyProviderProps) {
  const [readyMap, setReadyMap] = useState<Partial<Record<HomeScreenSection, boolean>>>({})

  const report = useCallback((section: HomeScreenSection, ready: boolean) => {
    setReadyMap((current) => {
      if (current[section] === ready) return current
      return { ...current, [section]: ready }
    })
  }, [])

  const isReady = HOME_ABOVE_FOLD_SECTIONS.every((section) => readyMap[section])

  useEffect(() => {
    onReadyChange(isReady)
  }, [isReady, onReadyChange])

  const value = useMemo(() => ({ report }), [report])

  return (
    <HomeScreenReadyContext.Provider value={value}>
      {children}
    </HomeScreenReadyContext.Provider>
  )
}

export function useReportHomeSection(section: HomeScreenSection, ready: boolean) {
  const context = useContext(HomeScreenReadyContext)

  useEffect(() => {
    context?.report(section, ready)
  }, [context, section, ready])
}
