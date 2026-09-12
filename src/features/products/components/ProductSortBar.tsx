import { useState } from 'react'
import { getPriceSortLabel, normalizeProductSort, PRODUCT_SORT_OPTIONS, type ProductSortKey } from '../utils/productSort'

interface Props {
  sort: string
  onSortChange: (sort: ProductSortKey) => void
}

const ProductSortBar = ({ sort, onSortChange }: Props) => {
  const [isPriceOpen, setIsPriceOpen] = useState(false)
  const activeSort = normalizeProductSort(sort)
  const isPriceActive = activeSort === 'price-asc' || activeSort === 'price-desc'
  const priceLabel = getPriceSortLabel(activeSort)

  return (
    <div className="bg-white border border-gray-200 rounded-sm mb-4 px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
      <span className="text-gray-500 select-none">Sort by</span>

      {PRODUCT_SORT_OPTIONS.map((option) => {
        const isSelected = activeSort === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onSortChange(option.value)
              setIsPriceOpen(false)
            }}
            className={isSelected ? 'dni-btn-active' : 'dni-btn'}
          >
            {option.label}
          </button>
        )
      })}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsPriceOpen((prev) => !prev)}
          className={`
            ${isPriceActive ? 'dni-btn-active' : 'dni-btn'}
            flex items-center justify-between min-w-[180px]
          `}
        >
          <span className="truncate">{priceLabel}</span>
          <span className={`text-xs transition-transform ${isPriceOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {isPriceOpen && (
          <div className="absolute left-0 top-full w-full bg-white border border-gray-200 shadow-md z-20">
            <button
              type="button"
              onClick={() => {
                onSortChange('price-asc')
                setIsPriceOpen(false)
              }}
              className={`w-full text-left px-3 py-2 ${activeSort === 'price-asc' ? 'dni-btn-active' : 'dni-btn'}`}
            >
              Price: Low to High
            </button>

            <button
              type="button"
              onClick={() => {
                onSortChange('price-desc')
                setIsPriceOpen(false)
              }}
              className={`w-full text-left px-3 py-2 ${activeSort === 'price-desc' ? 'dni-btn-active' : 'dni-btn'}`}
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