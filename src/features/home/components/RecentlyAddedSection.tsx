import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import ProductGrid from '@/features/products/components/ProductGrid'
import { fetchRecentProducts } from '@/features/products/store/productThunks'

const RecentlyAddedSection = () => {
    const dispatch = useAppDispatch()
    const {
        recentProducts,
        recentProductsNextCursor,
        recentProductsHasNextPage,
        recentProductsLoading,
        recentProductsStatus,
        recentProductsError,
    } = useAppSelector((state) => state.products)

    useEffect(() => {
        if (recentProductsStatus === 'idle') {
            void dispatch(fetchRecentProducts({}))
        }
    }, [dispatch, recentProductsStatus])

    return (
        <section className="py-6" aria-labelledby="recently-added-heading">
            <h2 id="recently-added-heading" className="mb-4 text-base uppercase font-semibold text-gray-500">
                Recently Added
            </h2>

            {recentProductsStatus === 'loading' && recentProducts.length === 0 && (
                <div className="text-sm text-gray-500" role="status">Loading products...</div>
            )}

            {recentProductsError && (
                <div className="text-sm text-red-500" role="alert">
                    Failed to load recently added products. Please try again later.
                </div>
            )}

            {recentProductsStatus === 'succeeded' && recentProducts.length === 0 && (
                <div className="text-sm text-gray-500">No recently added products yet.</div>
            )}

            {recentProducts.length > 0 && (
                <>
                    <ProductGrid products={recentProducts} showFindSimilar={false} />

                    {recentProductsHasNextPage && recentProductsNextCursor && (
                        <div className="mt-5 text-center">
                            <button
                                type="button"
                                className="dni-btn"
                                onClick={() => void dispatch(fetchRecentProducts({ cursor: recentProductsNextCursor }))}
                                disabled={recentProductsLoading}
                            >
                                {recentProductsLoading ? 'Loading...' : 'Load more'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    )
}

export default RecentlyAddedSection