import { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { productApi } from '@/features/products/api/productApi'
import { productDetailMaxStock } from '@/features/products/components/ProductQuantityInput'
import type { ProductDetail } from '@/features/products/types/productTypes'
import { selectCartItems } from '../store/cartSelectors'
import { setItemAvailableStock } from '../store/cartSlice'

function stockForLine(product: ProductDetail, variantId: string): number {
    const selected = variantId
        ? product.variants.find((row) => row.variantId === variantId) ?? null
        : null
    if (variantId && !selected) return product.stock ?? 0
    return productDetailMaxStock(product, selected)
}

export function useSyncCartAvailableStock() {
    const dispatch = useAppDispatch()
    const items = useAppSelector(selectCartItems)
    const stockKey = useMemo(
        () => items.map((item) => `${item.productId}:${item.variantId ?? ''}`).sort().join('|'),
        [items],
    )

    useEffect(() => {
        if (!stockKey) return
        let cancelled = false
        const lines = stockKey.split('|').map((part) => {
            const splitAt = part.indexOf(':')
            return {
                productId: part.slice(0, splitAt),
                variantId: part.slice(splitAt + 1),
            }
        })
        const productIds = [...new Set(lines.map((line) => line.productId).filter(Boolean))]

        void (async () => {
            const details = new Map<string, ProductDetail>()
            await Promise.all(
                productIds.map(async (productId) => {
                    try {
                        const response = await productApi.getDetail(productId)
                        details.set(productId, response.data.data)
                    } catch {
                        // Leave the previous stock value when the catalog cannot be read.
                    }
                }),
            )
            if (cancelled) return
            for (const line of lines) {
                const product = details.get(line.productId)
                if (!product) continue
                dispatch(setItemAvailableStock({
                    productId: line.productId,
                    variantId: line.variantId,
                    availableStock: stockForLine(product, line.variantId),
                }))
            }
        })()

        return () => {
            cancelled = true
        }
    }, [dispatch, stockKey])
}
