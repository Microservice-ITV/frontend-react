import ProductCard from '@/features/products/components/ProductCard'
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

    const isLoading = status === 'loading'
    const hasError = status === 'failed' && error

    if (isLoading) {
        return (
            <div className="py-6">
                <h2 className="text-xl font-semibold mb-4">{title}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Array.from({ length: maxInitialProducts }).map((_, index) => (
                        <div key={index} className="animate-pulse">
                            <div className="bg-gray-200 rounded-lg aspect-square mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (hasError) {
        return (
            <div className="py-6">
                <h2 className="text-xl font-semibold mb-4">{title}</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
            <h2 className="text-lg mb-4">{title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {initialProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
            
            {showSeeMore && remainingProducts.length > 0 && (
                <div className="mt-6 text-center">
                    <Link 
                        to="/cart/see-more"
                        className="inline-flex items-center px-4 py-2 border border-[var(--dni-primary)] text-[var(--dni-primary)] 
                                 rounded-lg hover:bg-[var(--dni-primary)] hover:text-white transition-colors"
                    >
                        See More ({remainingProducts.length} more)
                    </Link>
                </div>
            )}
        </div>
    )
}

export default RecommendationSection