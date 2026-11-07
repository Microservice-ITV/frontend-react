import TopOrderedProductCard from './TopOrderedProductCard'
import { StorefrontUnavailableNotice } from '@/components/feedback/StorefrontUnavailableNotice'
import { useHomeTopOrderedQuery } from '../queries/useHomeTopOrderedQuery'
import { useReportHomeSection } from '../homeScreenReady'

const TopOrderedProductSkeleton = () => (
    <div className="w-[200px] snap-start overflow-hidden border border-gray-100 bg-white">
        <div className="aspect-square animate-pulse bg-gray-200" />
        <div className="space-y-3 p-3">
            <div className="h-6 animate-pulse bg-gray-200" />
            <div className="h-10 animate-pulse bg-gray-200" />
        </div>
    </div>
)

const TopOrderedProducts = () => {
    const { data: products = [], isPending, isError, isFetched, isSuccess, refetch } =
        useHomeTopOrderedQuery(10)
    useReportHomeSection('topOrdered', isFetched)

    if (isSuccess && products.length === 0) {
        return null
    }

    return (
        <section aria-labelledby="top-ordered-products-heading" className="pt-6">
            <div className="mb-5 flex items-center justify-between px-4 sm:px-6">
                <h2 id="top-ordered-products-heading" className="text-base font-semibold uppercase text-gray-600">
                    Top Ordered Products
                </h2>
                {/* <Link
                    to="/all_categories"
                    className="inline-flex items-center gap-1 text-sm text-(--dni-primary) transition-colors hover:text-(--dni-primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--dni-primary) focus-visible:ring-offset-2"
                >
                    See All <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </Link> */}
            </div>

            <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
                {isPending && (
                    <div className="grid w-full min-w-max grid-flow-col auto-cols-[200px] gap-3">
                        {Array.from({ length: 6 }, (_, index) => <TopOrderedProductSkeleton key={index} />)}
                    </div>
                )}

                {isError && (
                    <StorefrontUnavailableNotice withRetry onRetry={() => { void refetch() }} />
                )}

                {isSuccess && products.length > 0 && (
                    <div className="grid w-full min-w-max grid-flow-col auto-cols-[200px] gap-3">
                        {products.map((product) => (
                            <TopOrderedProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

export default TopOrderedProducts
