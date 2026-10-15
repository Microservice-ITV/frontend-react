import type { ProductDetail, ProductVariant } from '@/features/products/types/productTypes'
import { productSellableStock } from '@/features/products/utils/variantStock'

const QTY_CAP = 99

/** Same stock read as the product detail page (shop + warehouse). */
export function productDetailMaxStock(
    product: ProductDetail,
    selectedVariant: ProductVariant | null,
): number {
    return productSellableStock(product, selectedVariant)
}

/** Same cap as the product detail quantity control. */
export function productDetailMaxQty(stock: number): number {
    return Math.min(QTY_CAP, Math.max(0, stock))
}

export function limitToDetailStock(quantity: number, stock: number | null | undefined): number {
    const safeQty = Number.isFinite(quantity) ? quantity : 0
    if (stock == null || !Number.isFinite(stock)) return Math.min(Math.max(0, safeQty), QTY_CAP)
    return Math.min(Math.max(0, safeQty), productDetailMaxQty(stock))
}

type ProductQuantityInputProps = {
    quantity: number
    stock: number | null | undefined
    onDecrease: () => void
    onIncrease: () => void
    /** When set, minus stops at this quantity. Product detail uses 1. */
    minimumQuantity?: number
}

const ProductQuantityInput = ({
    quantity,
    stock,
    onDecrease,
    onIncrease,
    minimumQuantity,
}: ProductQuantityInputProps) => {
    const knownStock = stock != null && Number.isFinite(stock)
    const maxStock = knownStock ? stock : QTY_CAP
    const maxQty = productDetailMaxQty(maxStock)
    const outOfStock = knownStock && maxStock <= 0
    const atMinimum = minimumQuantity != null && quantity <= minimumQuantity
    const atMaximum = outOfStock || quantity >= maxQty
    const stockNote = knownStock && maxQty < QTY_CAP && quantity >= maxQty
        ? `Stock is only ${maxQty}.`
        : null

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                <button
                    type="button"
                    onClick={onDecrease}
                    disabled={atMinimum || outOfStock}
                    className={`flex h-9 w-9 items-center justify-center text-gray-600 transition ${
                        atMinimum || outOfStock
                            ? 'cursor-not-allowed text-gray-300'
                            : 'cursor-pointer hover:bg-gray-50'
                    }`}
                    aria-label={atMinimum ? 'Quantity is needed for the applied bundles' : 'Decrease'}
                >
                    <svg viewBox="0 0 10 10" className="h-3 w-3 fill-current">
                        <polygon points="0 4.5 10 4.5 10 5.5 0 5.5" />
                    </svg>
                </button>

                <input
                    type="text"
                    value={quantity}
                    readOnly
                    className="h-9 w-11 border-x border-gray-200 text-center text-sm font-medium outline-none"
                />

                <button
                    type="button"
                    onClick={onIncrease}
                    disabled={atMaximum}
                    className={`flex h-9 w-9 items-center justify-center text-gray-600 transition ${
                        atMaximum
                            ? 'cursor-not-allowed text-gray-300'
                            : 'cursor-pointer hover:bg-gray-50'
                    }`}
                    aria-label={atMaximum && knownStock ? 'Only available stock can be added' : 'Increase'}
                >
                    <svg viewBox="0 0 10 10" className="h-3 w-3 fill-current">
                        <polygon points="10 4.5 5.5 4.5 5.5 0 4.5 0 4.5 4.5 0 4.5 0 5.5 4.5 5.5 4.5 10 5.5 10 5.5 5.5 10 5.5" />
                    </svg>
                </button>
            </div>
            {stockNote ? (
                <p className="max-w-[9rem] text-center text-[11px] leading-4 text-amber-700">{stockNote}</p>
            ) : null}
        </div>
    )
}

export default ProductQuantityInput
