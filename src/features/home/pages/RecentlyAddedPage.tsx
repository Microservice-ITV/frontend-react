import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import ProductGrid, { ProductGridSkeleton } from '@/features/products/components/ProductGrid'
import { fetchRecentProducts } from '@/features/products/store/productThunks'
import { fetchCategories } from '@/features/categories/store/categoryThunks'
import {
  selectCategoriesStatus,
  selectCategoriesWithProducts,
} from '@/features/categories/store/categorySelectors'
import { Typing } from '@/components/loading-ui/typing'

const ALL_CATEGORIES = 'all'

const RecentlyAddedPage = () => {
  const dispatch = useAppDispatch()
  const {
    recentProducts,
    recentProductsNextCursor,
    recentProductsHasNextPage,
    recentProductsLoading,
    recentProductsStatus,
    recentProductsError,
  } = useAppSelector((state) => state.products)
  const categoriesWithProducts = useAppSelector(selectCategoriesWithProducts)
  const categoriesStatus = useAppSelector(selectCategoriesStatus)

  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORIES)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (recentProductsStatus === 'idle') {
      void dispatch(fetchRecentProducts({}))
    }
  }, [dispatch, recentProductsStatus])

  useEffect(() => {
    if (categoriesStatus === 'idle') {
      void dispatch(fetchCategories())
    }
  }, [categoriesStatus, dispatch])

  const loadMore = useCallback(() => {
    if (
      !recentProductsHasNextPage ||
      !recentProductsNextCursor ||
      recentProductsLoading
    ) {
      return
    }
    void dispatch(fetchRecentProducts({ cursor: recentProductsNextCursor }))
  }, [
    dispatch,
    recentProductsHasNextPage,
    recentProductsNextCursor,
    recentProductsLoading,
  ])

  const filterCategories = useMemo(
    () =>
      [...categoriesWithProducts].sort((a, b) => a.name.localeCompare(b.name)),
    [categoriesWithProducts],
  )

  const filteredProducts = useMemo(() => {
    if (selectedCategoryId === ALL_CATEGORIES) return recentProducts
    return recentProducts.filter((product) => product.categoryId === selectedCategoryId)
  }, [recentProducts, selectedCategoryId])

  // Keep fetching while a category filter is empty but more pages exist.
  useEffect(() => {
    if (selectedCategoryId === ALL_CATEGORIES) return
    if (filteredProducts.length > 0) return
    if (!recentProductsHasNextPage || recentProductsLoading) return
    loadMore()
  }, [
    selectedCategoryId,
    filteredProducts.length,
    recentProductsHasNextPage,
    recentProductsLoading,
    loadMore,
  ])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore()
        }
      },
      { root: null, rootMargin: '400px 0px', threshold: 0 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore, filteredProducts.length])

  const isInitialLoading =
    (recentProductsStatus === 'loading' || recentProductsStatus === 'idle') &&
    recentProducts.length === 0

  const showCategoryFilters =
    filterCategories.length > 0 &&
    (recentProducts.length > 0 || recentProductsStatus === 'succeeded')

  return (
    <main className="min-h-screen bg-[#f5f5f5] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
          <h1 className="text-2xl font-semibold text-gray-900">Recently Added</h1>
          <Link
            to="/"
            className="text-sm font-medium text-[var(--dni-primary)] hover:underline"
          >
            Back to home
          </Link>
        </div>

        {showCategoryFilters && (
          <div
            className="mb-5 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:px-0"
            role="tablist"
            aria-label="Filter by category"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategoryId === ALL_CATEGORIES}
              onClick={() => setSelectedCategoryId(ALL_CATEGORIES)}
              className={`inline-flex shrink-0 items-center rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategoryId === ALL_CATEGORIES
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {filterCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={selectedCategoryId === category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={`inline-flex shrink-0 items-center rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
                  selectedCategoryId === category.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {isInitialLoading && <ProductGridSkeleton count={10} />}

        {recentProductsError && recentProducts.length === 0 && (
          <div className="border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">
              Unable to load recently added products. Please try again later.
            </p>
          </div>
        )}

        {recentProductsStatus === 'succeeded' &&
          !recentProductsLoading &&
          recentProducts.length === 0 && (
            <p className="text-sm text-gray-500">No recently added products yet.</p>
          )}

        {recentProducts.length > 0 &&
          filteredProducts.length === 0 &&
          !recentProductsLoading &&
          !recentProductsHasNextPage && (
            <p className="text-sm text-gray-500">No recently added products in this category.</p>
          )}

        {filteredProducts.length > 0 && (
          <>
            <ProductGrid products={filteredProducts} showFindSimilar={false} />

            <div ref={loadMoreRef} className="h-8 w-full" aria-hidden />

            {recentProductsLoading && (
              <div className="flex justify-center py-6" role="status" aria-live="polite">
                <Typing className="w-8" />
              </div>
            )}

            {!recentProductsHasNextPage && !recentProductsLoading && (
              <p className="py-6 text-center text-xs text-slate-500">
                Showing {filteredProducts.length} products
              </p>
            )}
          </>
        )}

        {filteredProducts.length === 0 &&
          recentProductsLoading &&
          (recentProducts.length > 0 || selectedCategoryId !== ALL_CATEGORIES) && (
            <div className="flex justify-center py-10" role="status" aria-live="polite">
              <Typing className="w-8" />
            </div>
          )}
      </div>
    </main>
  )
}

export default RecentlyAddedPage
