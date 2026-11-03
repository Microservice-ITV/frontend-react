import { useEffect, useMemo, useState } from 'react'
import CartBundleBanner from '@/features/bundles/components/CartBundleBanner'
import type { BundleMatchResult } from '@/features/bundles/types/bundleTypes'
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
import { useSyncCartAvailableStock } from '../hooks/useSyncCartAvailableStock'
import { selectAuthUser } from '@/features/auth/store/authSelectors'
import { vouchersApi, type CustomerVoucher } from '@/features/account/api/vouchersApi'
import { clearSelectedVouchers, setSelectedVouchers } from '../store/cartSlice'

const CartPage = () => {
    const dispatch = useAppDispatch()
    useSyncCartAvailableStock()
    const [showGuestModal, setShowGuestModal] = useState(false)
    const [bundleMatch, setBundleMatch] = useState<BundleMatchResult | null>(null)
    const items = useAppSelector(selectCartItems)
    const total = useAppSelector(selectCartTotal)
    const cartProductKey = useAppSelector(selectCartProductKey)
    const user = useAppSelector(selectAuthUser)
    const voucherState = useAppSelector(state => state.cart)
    const [vouchers, setVouchers] = useState<CustomerVoucher[]>([])
    const [voucherLoadError, setVoucherLoadError] = useState(false)
    const [vouchersLoaded, setVouchersLoaded] = useState(false)
    const [voucherLoading, setVoucherLoading] = useState(false)
    const selectedVoucherCodes = voucherState.voucherSelectionUserId === user?.id
        ? voucherState.selectedVoucherCodes
        : []

    useEffect(() => {
        let cancelled = false
        if (!user?.id) {
            setVouchers([])
            setVouchersLoaded(true)
            setVoucherLoading(false)
            dispatch(clearSelectedVouchers())
            return
        }
        setVouchersLoaded(false)
        setVoucherLoading(true)
        setVoucherLoadError(false)
        void vouchersApi.mine().then(rows => {
            if (!cancelled) {
                const active = rows.filter(voucher => voucher.status === 'ACTIVE' && (!voucher.expires_at || new Date(voucher.expires_at).getTime() > Date.now()))
                setVouchers(active)
                setVoucherLoadError(false)
                setVouchersLoaded(true)
                setVoucherLoading(false)
            }
        }).catch(() => {
            if (!cancelled) {
                setVoucherLoadError(true)
                setVouchersLoaded(true)
                setVoucherLoading(false)
            }
        })
        return () => { cancelled = true }
    }, [dispatch, user?.id])

    useEffect(() => {
        if (!user?.id || !vouchersLoaded || voucherLoadError) return
        const codes = voucherState.voucherSelectionUserId === user.id
            ? voucherState.selectedVoucherCodes.filter(code => vouchers.some(voucher => voucher.code === code))
            : []
        if (voucherState.voucherSelectionUserId !== user.id || codes.length !== voucherState.selectedVoucherCodes.length) {
            dispatch(setSelectedVouchers({ userId: user.id, codes }))
        }
    }, [dispatch, user?.id, vouchersLoaded, voucherLoadError, vouchers, voucherState.voucherSelectionUserId, voucherState.selectedVoucherCodes])
    const cartShopIdsKey = useMemo(
        () => [...new Set(items.map((i) => i.shopId).filter(Boolean))].sort().join(','),
        [items],
    )

    const cartProductIds = useMemo(
        () => (cartProductKey ? cartProductKey.split(',') : []),
        [cartProductKey],
    )
    const firstProductId = cartProductIds[0]
    const bundleMinimumQty = useMemo(() => {
        const required = new Map<string, number>()
        const bundles = new Map<string, number>()
        for (const offer of bundleMatch?.offers ?? []) {
            if (!offer.complete || (offer.savings ?? 0) <= 0) continue
            const seen = new Set<string>()
            for (const row of offer.items) {
                if (!row.in_cart || seen.has(row.product_id)) continue
                seen.add(row.product_id)
                const need = Math.max(1, row.quantity || 1)
                required.set(row.product_id, (required.get(row.product_id) ?? 0) + need)
                bundles.set(row.product_id, (bundles.get(row.product_id) ?? 0) + 1)
            }
        }
        return new Map(
            [...required.entries()].filter(([productId]) => (bundles.get(productId) ?? 0) > 1),
        )
    }, [bundleMatch])

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
                    <div className="space-y-3">
                        <CartBundleBanner items={items} onMatch={setBundleMatch} />
                        <CartItemLists
                            items={items}
                            bundleMinimumQty={bundleMinimumQty}
                            vouchers={vouchers}
                            selectedVoucherCodes={selectedVoucherCodes}
                            voucherLoadError={voucherLoadError}
                            voucherLoading={voucherLoading}
                            onVoucherSelectionChange={codes => user?.id && dispatch(setSelectedVouchers({ userId: user.id, codes }))}
                        />
                    </div>
                    <aside className="max-lg:sticky max-lg:bottom-0 max-lg:z-20 lg:sticky lg:top-4">
                        <CartSummary
                            total={total}
                            bundleSavings={bundleMatch?.discounts ?? []}
                            onGuestCheckout={() => setShowGuestModal(true)}
                        />
                    </aside>
                </div>

                {firstProductId && (
                    <RecommendationSection
                        productId={firstProductId}
                        title="YOU MAY ALSO LIKE"
                        description="Products often bought with the items in your cart, shown at their regular prices."
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
