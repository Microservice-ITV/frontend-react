import { useState, useEffect } from 'react'

type SortType =
  | 'popular'
  | 'latest'
  | 'top-sales'
  | 'price-asc'
  | 'price-desc'

const ProductSortBar = () => {
  const [sort, setSort] = useState<SortType>('popular')
  const [isPriceOpen, setIsPriceOpen] = useState(false)

  const isPriceActive = sort === 'price-asc' || sort === 'price-desc'

  const priceLabel = sort === 'price-asc' ? 'Price: Low to High' : sort === 'price-desc' ? 'Price: High to Low' : 'Price'

/**
   * SORT EFFECT (Single Source of Truth)
   *
   * This effect runs EVERY TIME the `sort` value changes.
   *
   * This is the correct place to:
   * 1. Call an API with sorting params
   * 2. Trigger Redux / Zustand / Context updates
   * 3. Update URL query params (?sort=price_asc)
   * 4. Perform client-side sorting (if data already loaded)
   *
   * DO NOT put UI logic here
   * ONLY (side effects)
   */
useEffect(() => {
    // Enable any of the examples below as needed // *****

    // Example 1: API call
    // fetchProducts({
    //   sortBy: sort
    // })

    // Example 2️: URL sync
    // const params = new URLSearchParams(window.location.search)
    // params.set('sort', sort)
    // window.history.replaceState(null, '', `?${params.toString()}`)

    // Example 3️: Client-side sorting
    // if (sort === 'price-asc') {
    //   sortProductsLowToHigh()
    // } else if (sort === 'price-desc') {
    //   sortProductsHighToLow()
    // }
  }, [sort])

  return (
    <div className="bg-white border border-gray-200 rounded-sm mb-4 px-4 py-3 flex items-center gap-3 text-sm">
      <span className="text-gray-500 select-none">Sort by</span>

      {/* POPULAR */}
      <button
        onClick={() => {
          setSort('popular')
          setIsPriceOpen(false)
        }}
        className={sort === 'popular' ? 'dni-btn-active' : 'dni-btn'}
      >
        Popular
      </button>

      {/* LATEST */}
      <button
        onClick={() => {
          setSort('latest')
          setIsPriceOpen(false)
        }}
        className={sort === 'latest' ? 'dni-btn-active' : 'dni-btn'}
      >
        Latest
      </button>

      {/* TOP SALES */}
      <button
        onClick={() => {
          setSort('top-sales')
          setIsPriceOpen(false)
        }}
        className={sort === 'top-sales' ? 'dni-btn-active' : 'dni-btn'}
      >
        Top Sales
      </button>

      {/* PRICE DROPDOWN */}
      <div className="relative">
        <button
          onClick={() => setIsPriceOpen(prev => !prev)}
          className={`
            ${isPriceActive ? 'dni-btn-active' : 'dni-btn'}
            flex items-center justify-between
            min-w-[180px]
          `}
        >
          <span className="truncate">{priceLabel}</span>
          <span className={`text-xs transition-transform ${isPriceOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {/* DROPDOWN */}
        {isPriceOpen && (
          <div className="absolute left-0 top-full w-full bg-white border border-gray-200 shadow-md z-20">
            <button
              onClick={() => {
                setSort('price-asc')
                setIsPriceOpen(false)
              }}
              className={`
                w-full text-left px-3 py-2
                ${sort === 'price-asc' ? 'dni-btn-active' : 'dni-btn'}
              `}
            >
              Price: Low to High
            </button>

            <button
              onClick={() => {
                setSort('price-desc')
                setIsPriceOpen(false)
              }}
              className={`
                w-full text-left px-3 py-2
                ${sort === 'price-desc' ? 'dni-btn-active' : 'dni-btn'}
              `}
            >
              Price: High to Low
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductSortBar