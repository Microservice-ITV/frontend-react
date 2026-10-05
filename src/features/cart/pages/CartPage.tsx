import { useEffect, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fetchShopProfilesForCurrentCart } from '@/features/shipping/store/shippingThunks'
import { selectCartItems, selectCartTotal, selectCartProductKey } from '@/features/cart/store/cartSelectors'
import { setItemShop } from '@/features/cart/store/cartSlice'
import { resolveProductShop } from '@/features/products/api/productApi'
import { fetchRelatedProducts, fetchBroughtTogetherProducts } from '@/features/products/store/recommendationsSlice'

import CartItemLists from '../components/CartItemLists'
import CartSummary, { GuestCheckoutModal } from '../components/CartSummary'
import CartEmptyState from '../components/CartEmptyState'
import RecommendationSection from '@/features/products/components/RecommendationSection'

const CartPage = () => {
    const dispatch = useAppDispatch()
    const [showGuestModal, setShowGuestModal] = useState(false)
    const items = useAppSelector(selectCartItems)
    const total = useAppSelector(selectCartTotal)
    const cartProductKey = useAppSelector(selectCartProductKey)
    const cartShopIdsKey = useMemo(
        () => [...new Set(items.map((i) => i.shopId).filter(Boolean))].sort().join(','),
        [items],
    )

    const cartProductIds = useMemo(
        () => (cartProductKey ? cartProductKey.split(',') : []),
        [cartProductKey],
    )
    const firstProductId = cartProductIds[0]

    const staleShopKey = useMemo(
        () =>
            items
                .filter(
                    (item) =>
                        !item.shopId ||
                        item.shopId === 'unknown' ||
                        item.shopName === 'Seller store',
                )
                .map((item) => `${item.productId}:${item.variantId}`)
                .join('|'),
        [items],
    )

    useEffect(() => {
        if (!cartShopIdsKey) return
        void dispatch(fetchShopProfilesForCurrentCart())
    }, [dispatch, cartShopIdsKey])

    useEffect(() => {
        if (!staleShopKey) return
        let cancelled = false
        const stale = items.filter(
            (item) =>
                !item.shopId ||
                item.shopId === 'unknown' ||
                item.shopName === 'Seller store',
        )
        void (async () => {
            for (const item of stale) {
                const shop = await resolveProductShop(item.productId)
                if (cancelled || !shop) continue
                dispatch(
                    setItemShop({
                        productId: item.productId,
                        variantId: item.variantId,
                        shopId: shop.shopId,
                        shopName: shop.shopName,
                    }),
                )
            }
        })()
        return () => {
            cancelled = true
        }
    }, [dispatch, staleShopKey, items])

    useEffect(() => {
        if (cartProductIds.length > 0) {
            dispatch(fetchRelatedProducts(cartProductIds))
            dispatch(fetchBroughtTogetherProducts(cartProductIds))
        }
    }, [dispatch, cartProductKey])

    if (items.length === 0) {
        return <CartEmptyState />
    }

    return (
        <div className="relative bg-[#f5f5f5] py-4 sm:py-5">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
                <h1 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Shopping cart</h1>

                <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-5">
                    <CartItemLists items={items} />
                    <aside className="max-lg:sticky max-lg:bottom-0 max-lg:z-20 lg:sticky lg:top-4">
                        <CartSummary total={total} onGuestCheckout={() => setShowGuestModal(true)} />
                    </aside>
                </div>

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
            {showGuestModal && <GuestCheckoutModal onClose={() => setShowGuestModal(false)} />}
        </div>
    )
}

export default CartPage
