import { useState, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const DEBOUNCE_MS = 400
const MIN_QUERY_LENGTH = 2

const CustomerServiceHero = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const queryRef = useRef(searchQuery)
  queryRef.current = searchQuery

  const doSearch = useCallback((q?: string) => {
    const query = (q ?? queryRef.current).trim()
    if (query.length > 0) {
      navigate(`/search?q=${encodeURIComponent(query)}`)
    }
  }, [navigate])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    const trimmed = value.trim()
    if (trimmed.length >= MIN_QUERY_LENGTH) {
      timerRef.current = setTimeout(() => {
        doSearch(trimmed)
      }, DEBOUNCE_MS)
    }
  }, [doSearch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      doSearch()
    }
  }, [doSearch])

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 bg-gradient-to-br from-emerald-100 via-emerald-50 to-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-center text-2xl font-semibold text-emerald-700 sm:text-3xl">
          Hi, how can we help?
        </h1>

        <div className="mx-auto mt-8 flex max-w-3xl items-stretch overflow-hidden rounded-sm border border-gray-300 bg-white focus-within:border-emerald-500">
          <input
            type="text"
            value={searchQuery}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search products, brands and more"
            className="min-w-0 flex-1 px-4 py-4 text-base text-gray-700 outline-none placeholder:text-gray-500"
          />
          <button
            type="button"
            onClick={() => {
              if (timerRef.current) {
                clearTimeout(timerRef.current)
              }
              doSearch()
            }}
            className="flex h-[58px] w-[58px] shrink-0 items-center justify-center border-l border-gray-300 bg-emerald-600 text-white transition-colors hover:bg-emerald-700 cursor-pointer"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default CustomerServiceHero