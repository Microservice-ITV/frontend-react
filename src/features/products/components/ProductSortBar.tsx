import { useState } from 'react'

type SortType =
  | 'popular'
  | 'latest'
  | 'top-sales'
  | 'price-asc'
  | 'price-desc'

interface Props {
  sort: string
  onSortChange: (sort: string) => void
}

const ProductSortBar = ({ sort, onSortChange }: Props) => {
  const [isPriceOpen, setIsPriceOpen] = useState(false)

  const isPriceActive = sort === 'price-asc' || sort === 'price-desc'

  const priceLabel = sort === 'price-asc' ? 'Price: Low to High' : sort === 'price-desc' ? 'Price: High to Low' : 'Price'

  return (
    <div className="bg-white border border-gray-200 rounded-sm mb-4 px-4 py-3 flex items-center gap-3 text-sm">
      <span className="text-gray-500 select-none">Sort by</span>

      {/* POPULAR */}
      <button
        onClick={() => {
          onSortChange('popular')
          setIsPriceOpen(false)
        }}
        className={sort === 'popular' ? 'dni-btn-active' : 'dni-btn'}
      >
        Popular
      </button>

      {/* LATEST */}
      <button
        onClick={() => {
          onSortChange('latest')
          setIsPriceOpen(false)
        }}
        className={sort === 'latest' ? 'dni-btn-active' : 'dni-btn'}
      >
        Latest
      </button>

      {/* TOP SALES */}
      <button
        onClick={() => {
          onSortChange('top-sales')
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
                onSortChange('price-asc')
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
                onSortChange('price-desc')
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