import { useEffect, useRef, useState } from 'react'
import { useAppSelector } from '@/app/hooks'
import { selectCartItems, selectCartTotal } from '@/features/cart/store/cartSelectors'

import CartHeader from '../components/CartHeader'
import CartItemLists from '../components/CartItemLists'
import CartSummary from '../components/CartSummary'
import CartEmptyState from '../components/CartEmptyState'

const CartPage = () => {
    const items = useAppSelector(selectCartItems)
    const total = useAppSelector(selectCartTotal)

    const contentRef = useRef<HTMLDivElement>(null)
    const [isFloating, setIsFloating] = useState(false)

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
                    max-w-6xl mx-auto px-4 py-6 space-y-4
                    ${isFloating ? 'pb-[140px]' : ''}
                `}
            >
                <CartHeader />
                <CartItemLists items={items} />

                {/* NORMAL SUMMARY (SCROLL UP STATE) */}
                {!isFloating && (
                    <CartSummary total={total} />
                )}
            </div>

            {/* FLOATING SUMMARY (SCROLL DOWN STATE) */}
            {isFloating && (
                <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-6xl px-4 z-30">
                    <CartSummary total={total} />
                </div>
            )}
        </main>
    )
}

export default CartPage