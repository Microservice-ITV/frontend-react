import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import ProductGrid, { ProductGridSkeleton } from '@/features/products/components/ProductGrid'
import Pagination from '@/components/ui/Pagination'
import { fetchRecentProducts } from '@/features/products/store/productThunks'

const PAGE_SIZE = 10

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

  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (recentProductsStatus === 'idle') {
      void dispatch(fetchRecentProducts({}))
    }
  }, [dispatch, recentProductsStatus])

  // Prefetch remaining recent pages so client pagination matches "You May Also Like"
  useEffect(() => {
    if (
      recentProductsStatus === 'succeeded' &&
      recentProductsHasNextPage &&
      recentProductsNextCursor &&
      !recentProductsLoading
    ) {
      void dispatch(fetchRecentProducts({ cursor: recentProductsNextCursor }))
    }
  }, [
    dispatch,
    recentProductsStatus,
    recentProductsHasNextPage,
    recentProductsNextCursor,
    recentProductsLoading,
  ])

  const isPrefetching = recentProductsHasNextPage || recentProductsLoading
  const isInitialLoading =
    (recentProductsStatus === 'loading' || isPrefetching) && recentProducts.length === 0

  const totalPages = Math.max(1, Math.ceil(recentProducts.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pagedProducts = useMemo(
    () => recentProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [recentProducts, safePage],
  )
  const pageStart = recentProducts.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(safePage * PAGE_SIZE, recentProducts.length)

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  return (
    <main className="min-h-screen bg-[#f5f5f5] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Recently Added</h1>
          <Link
            to="/"
            className="text-sm font-medium text-[var(--dni-primary)] hover:underline"
          >
            Back to home
          </Link>
        </div>

        {isInitialLoading && <ProductGridSkeleton count={10} />}

        {recentProductsError && recentProducts.length === 0 && (
          <div className="border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">
              Unable to load recently added products. Please try again later.
            </p>
          </div>
        )}

        {recentProductsStatus === 'succeeded' &&
          !isPrefetching &&
          recentProducts.length === 0 && (
            <p className="text-sm text-gray-500">No recently added products yet.</p>
          )}

        {recentProducts.length > 0 && !isInitialLoading && (
          <>
            {isPrefetching && (
              <p className="mb-4 text-xs text-slate-500" role="status">
                Loading more products…
              </p>
            )}

            <ProductGrid products={pagedProducts} showFindSimilar={false} />

            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <p className="text-xs text-slate-600">
                  Showing {pageStart}-{pageEnd} of {recentProducts.length} products
                </p>
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  className="justify-center sm:justify-end"
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default RecentlyAddedPage
