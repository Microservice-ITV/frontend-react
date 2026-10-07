import ProductGrid, { ProductGridSkeleton } from '@/features/products/components/ProductGrid'
import { Link } from 'react-router-dom'
import { CircleArrowRight } from 'lucide-react'
import { memo, useMemo } from 'react'
import { useAppSelector } from '@/app/hooks'
import { selectRecommendationsStatus, selectRecommendationsError } from '@/features/products/store/recommendationsSlice'
import { selectRelatedProducts, selectBroughtTogetherProducts } from '@/features/products/store/recommendationsSlice'

interface RecommendationSectionProps {
    productId: string
    title: string
    description?: string
    showSeeMore?: boolean
    maxInitialProducts?: number
    excludeProductIds?: string[]
}

const RecommendationSection = ({ 
    productId, 
    title,
    description,
    showSeeMore = true, 
    maxInitialProducts = 10,
    excludeProductIds = []
}: RecommendationSectionProps) => {
    const relatedProducts = useAppSelector(selectRelatedProducts)
    const broughtTogetherProducts = useAppSelector(selectBroughtTogetherProducts)
    const status = useAppSelector(selectRecommendationsStatus)
    const error = useAppSelector(selectRecommendationsError)

    // Exclude the anchor product plus any other products already in the cart
    const excludeIds = useMemo(
        () => new Set([productId, ...excludeProductIds]),
        [productId, excludeProductIds],
    )

    // Rank co-purchased (brought-together) products first, then related ones
    const allRecommendations = useMemo(() => {
        const merged = [...broughtTogetherProducts, ...relatedProducts]
        const seen = new Set<string>()
        return merged.filter((product) => {
            if (product.id == null || seen.has(product.id) || excludeIds.has(product.id)) {
                return false
            }
            seen.add(product.id)
            return true
        })
    }, [relatedProducts, broughtTogetherProducts, excludeIds])

    const initialProducts = allRecommendations.slice(0, maxInitialProducts)
    const remainingProducts = allRecommendations.slice(maxInitialProducts)
    const canSeeMore = showSeeMore && remainingProducts.length > 0

    // A cart change refetches recommendations. Keep the current cards mounted
    // during that refresh so the grid does not swap to skeletons and back.
    const isInitialLoading = status === 'loading' && allRecommendations.length === 0
    const hasError = status === 'failed' && error && allRecommendations.length === 0

    const header = (
        <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            {(description || canSeeMore) && (
                <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="min-w-0 text-sm text-gray-600">{description}</p>
                    {canSeeMore && (
                        <Link
                            to="/cart/see-more"
                            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[var(--dni-primary)] hover:underline"
                        >
                            See more
                            <CircleArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    )}
                </div>
            )}
        </div>
    )

    if (isInitialLoading) {
        return (
            <div className="py-6">
                {header}
                <ProductGridSkeleton count={maxInitialProducts} />
            </div>
        )
    }

    if (hasError) {
        return (
            <div className="py-6">
                {header}
                <div className="border border-red-200 bg-red-50 p-4">
                    <p className="text-red-600 text-sm">
                        Unable to load recommendations. Please try again later.
                    </p>
                </div>
            </div>
        )
    }

    if (initialProducts.length === 0) {
        return null
    }

    return (
        <div className="py-6">
            {header}
            <ProductGrid products={initialProducts} />
        </div>
    )
}

export default memo(RecommendationSection)
