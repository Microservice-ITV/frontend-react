import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchShopProfilesForCurrentCart } from '@/features/shipping/store/shippingThunks'
import { selectCartItems, selectCartTotal } from '@/features/cart/store/cartSelectors'
import { fetchRelatedProducts, fetchBroughtTogetherProducts } from '@/features/products/store/recommendationsSlice'

import CartHeader from '../components/CartHeader'
import CartItemLists from '../components/CartItemLists'
import CartSummary from '../components/CartSummary'
import CartEmptyState from '../components/CartEmptyState'
import RecommendationSection from '@/features/products/components/RecommendationSection'

const CartPage = () => {
    const dispatch = useAppDispatch()
    const items = useAppSelector(selectCartItems)
    const total = useAppSelector(selectCartTotal)
    const cartShopIdsKey = useMemo(
        () => [...new Set(items.map((i) => i.shopId).filter(Boolean))].sort().join(','),
        [items],
    )

    const contentRef = useRef<HTMLDivElement>(null)
    const [isFloating, setIsFloating] = useState(false)

    // Get all product IDs in cart for recommendations (aggregated across ALL items)
    const cartProductIds = useMemo(
        () => [...new Set(items.map((i) => i.productId).filter(Boolean))],
        [items],
    )
    const firstProductId = cartProductIds[0]

    useEffect(() => {
        if (!cartShopIdsKey) return
        void dispatch(fetchShopProfilesForCurrentCart())
    }, [dispatch, cartShopIdsKey])

    // Fetch recommendations aggregated across every product in the cart
    useEffect(() => {
        if (cartProductIds.length > 0) {
            dispatch(fetchRelatedProducts(cartProductIds))
            dispatch(fetchBroughtTogetherProducts(cartProductIds))
        }
    }, [dispatch, cartProductIds])

    useEffect(() => {
        const onScroll = () => {
            if (!contentRef.current) return

            const contentBottom = contentRef.current.offsetTop + contentRef.current.offsetHeight
            const viewportBottom = window.scrollY + window.innerHeight
            setIsFloating(viewportBottom < contentBottom)
        }

        window.addEventListener('scroll', onScroll)
        onScroll()

        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    if (items.length === 0) {
        return <CartEmptyState />
    }

    return (
        <main className="min-h-screen bg-[#f5f5f5]">
            {/* CART CONTENT */}
            <div
                ref={contentRef}
                className={`
                    max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4
                    ${isFloating ? 'pb-[140px]' : ''}
                `}
            >
                <CartHeader />
                <CartItemLists items={items} />

                {/* CART SUMMARY */}
                <CartSummary total={total} />

                {/* RECOMMENDATIONS SECTION */}
                {firstProductId && (
                    <RecommendationSection 
                        productId={firstProductId}
                        title="YOU MAY ALSO LIKE"
                        showSeeMore={true}
                        maxInitialProducts={10}
                        excludeProductIds={cartProductIds}
                    />
                )}
            </div> 
        </main>
    )
}

export default CartPage