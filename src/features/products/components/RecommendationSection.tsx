import ProductGrid, { ProductGridSkeleton } from '@/features/products/components/ProductGrid'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAppSelector } from '@/app/hooks'
import { selectRecommendationsStatus, selectRecommendationsError } from '@/features/products/store/recommendationsSlice'
import { selectRelatedProducts, selectBroughtTogetherProducts } from '@/features/products/store/recommendationsSlice'

interface RecommendationSectionProps {
    productId: string
    title: string
    showSeeMore?: boolean
    maxInitialProducts?: number
    excludeProductIds?: string[]
}

const RecommendationSection = ({ 
    productId, 
    title, 
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

    const isLoading = status === 'loading'
    const hasError = status === 'failed' && error

    const header = (
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            {canSeeMore && (
                <Link
                    to="/cart/see-more"
                    className="shrink-0 text-sm font-medium text-[var(--dni-primary)] hover:underline"
                >
                    See more
                </Link>
            )}
        </div>
    )

    if (isLoading) {
        return (
            <div className="py-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                </div>
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

export default RecommendationSection
