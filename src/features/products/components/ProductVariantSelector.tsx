import { useEffect, useMemo, useRef, useState } from 'react'
import type { ProductVariant } from '@/features/products/types/productTypes'

function uniqByColor(variants: ProductVariant[]): ProductVariant[] {
    const seen = new Set<string>()
    return variants.filter((v) => {
        if (seen.has(v.colorId)) return false
        seen.add(v.colorId)
        return true
    })
}

function uniqBySizeForColor(variants: ProductVariant[], colorId: string): ProductVariant[] {
    const rows = variants.filter((v) => v.colorId === colorId)
    const seen = new Set<string>()
    return rows.filter((v) => {
        if (seen.has(v.sizeId)) return false
        seen.add(v.sizeId)
        return true
    })
}

export function pickDefaultVariant(variants: ProductVariant[]): ProductVariant | null {
    if (variants.length === 0) return null
    const primaryOk = variants.find((v) => v.isPrimary && v.shopStock > 0)
    if (primaryOk) return primaryOk
    const inStock = variants.find((v) => v.shopStock > 0)
    return inStock ?? variants[0] ?? null
}

/** Label for a SKU when color/size are missing or duplicated in the read model. */
export function variantDisplayLabel(v: ProductVariant): string {
    const parts = [v.colorName, v.sizeName].filter((s) => s && s.trim())
    if (parts.length) return parts.join(' · ')
    if (v.sku?.trim()) return v.sku.trim()
    return 'Option'
}

function SelectedCheck() {
    return (
        <span
            className="pointer-events-none absolute bottom-0 right-0 flex h-4 w-4 items-end justify-end rounded-tl bg-[var(--dni-primary)] pb-px pl-px text-[10px] font-bold leading-none text-white shadow-sm"
            aria-hidden
        >
            ✓
        </span>
    )
}

type Props = {
    productId: string
    variants: ProductVariant[]
    /** First gallery image for chip thumbnails when per-variant images are unavailable */
    thumbnailUrl?: string
    /** Prefer per-SKU thumb (e.g. from `imageIndexes`) over `thumbnailUrl` */
    getVariantThumbnail?: (v: ProductVariant) => string | undefined
    /** Called when the resolved variant changes (price/stock for parent UI). */
    onVariantChange: (variant: ProductVariant | null) => void
}

/**
 * Color and Size rows stay visible even when a product has only one of each.
 * Falls back to an Option row when SKUs have no color or size names.
 * Single source of truth: `selectedVariantId`.
 */
const ProductVariantSelector = ({
    productId,
    variants,
    thumbnailUrl,
    getVariantThumbnail,
    onVariantChange,
}: Props) => {
    const variantSig = useMemo(
        () => variants.map((v) => v.variantId).sort().join(','),
        [variants],
    )
    const [selectedVariantId, setSelectedVariantId] = useState('')

    // Reset when navigating products or when the SKU set changes (use variantSig, not variants ref)
    useEffect(() => {
        const def = pickDefaultVariant(variants)
        setSelectedVariantId(def?.variantId ?? '')
        // eslint-disable-next-line react-hooks/exhaustive-deps -- variants identity changes every render; variantSig is the stable fingerprint
    }, [productId, variantSig])

    const selected = useMemo(() => {
        if (variants.length === 0) return null
        const row = variants.find((v) => v.variantId === selectedVariantId)
        return row ?? pickDefaultVariant(variants) ?? null
    }, [variants, selectedVariantId])

    // Keep id aligned when resolution falls back (e.g. id missing from list)
    useEffect(() => {
        if (!selected) return
        if (selected.variantId !== selectedVariantId) {
            setSelectedVariantId(selected.variantId)
        }
    }, [selected, selectedVariantId])

    const lastEmitted = useRef<string | undefined>(undefined)
    useEffect(() => {
        const id = selected?.variantId
        if (id === lastEmitted.current) return
        lastEmitted.current = id
        onVariantChange(selected ?? null)
    }, [selected, onVariantChange])

    const colorOptions = useMemo(() => uniqByColor(variants), [variants])
    const currentColorId = selected?.colorId ?? ''
    const sizeOptions = useMemo(
        () => (currentColorId ? uniqBySizeForColor(variants, currentColorId) : []),
        [variants, currentColorId],
    )

    const hasLabel = (value: string | undefined | null) => Boolean(value?.trim())
    const showColor = colorOptions.some((v) => hasLabel(v.colorName) || hasLabel(v.colorCode))
    const showSize = sizeOptions.some((v) => hasLabel(v.sizeName) || hasLabel(v.sizeCode))
    const showFallback = variants.length > 1 && !showColor && !showSize

    const handleColor = (nextColorId: string) => {
        const withColor = variants.filter((v) => v.colorId === nextColorId)
        if (withColor.length === 0) return
        const cur = variants.find((v) => v.variantId === selectedVariantId)
        const preferSize = cur?.sizeId
        const sameSize =
            preferSize &&
            withColor.find((v) => v.sizeId === preferSize && v.shopStock > 0)
        const pick = sameSize ?? pickDefaultVariant(withColor) ?? withColor[0]
        setSelectedVariantId(pick.variantId)
    }

    const handleSize = (nextSizeId: string) => {
        const cur = variants.find((v) => v.variantId === selectedVariantId) ?? pickDefaultVariant(variants)
        if (!cur) return
        const match =
            variants.find(
                (v) => v.colorId === cur.colorId && v.sizeId === nextSizeId && v.shopStock > 0,
            ) ?? variants.find((v) => v.colorId === cur.colorId && v.sizeId === nextSizeId)
        if (match) setSelectedVariantId(match.variantId)
    }

    if (!showColor && !showSize && !showFallback) {
        return null
    }

    const pillClass = (active: boolean, disabled: boolean) =>
        [
            'relative inline-flex items-center gap-2 rounded border px-3 py-2 text-xs sm:text-sm transition',
            disabled
                ? 'cursor-not-allowed border-dashed border-gray-200 bg-gray-50 text-gray-400'
                : active
                  ? 'border-[var(--dni-primary)] bg-orange-50/40 text-gray-900 ring-1 ring-[var(--dni-primary)]'
                  : 'cursor-pointer border-gray-200 bg-white text-gray-800 hover:border-gray-300',
        ].join(' ')

    const thumbForVariant = (v: ProductVariant) =>
        getVariantThumbnail?.(v)?.trim() || thumbnailUrl?.trim() || ''

    const thumb = (v: ProductVariant) => {
        const src = thumbForVariant(v)
        return (
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded border border-gray-100 bg-gray-50">
                {src ? (
                    <img src={src} alt="" className="h-full w-full object-cover" />
                ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                        ·
                    </span>
                )}
            </span>
        )
    }

    return (
        <div className="space-y-3 text-xs sm:text-sm">
            {showFallback && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                    <span className="w-20 shrink-0 pt-2 text-gray-500 sm:w-24">Option</span>
                    <div className="flex flex-wrap gap-2">
                        {variants.map((v) => {
                            const disabled = v.shopStock <= 0
                            const active = v.variantId === selected?.variantId
                            const label = variantDisplayLabel(v)
                            return (
                                <button
                                    key={v.variantId}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => !disabled && setSelectedVariantId(v.variantId)}
                                    className={pillClass(active, disabled)}
                                >
                                    {thumb(v)}
                                    <span className="max-w-[200px] text-left leading-tight">{label}</span>
                                    {active && !disabled ? <SelectedCheck /> : null}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {showColor && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                    <span className="w-20 shrink-0 pt-2 text-gray-500 sm:w-24">Color</span>
                    <div className="flex flex-wrap gap-2">
                        {colorOptions.map((v) => {
                            const anyInColor = variants.some(
                                (x) => x.colorId === v.colorId && x.shopStock > 0,
                            )
                            const disabled = !anyInColor
                            const active = v.colorId === selected?.colorId
                            const label = v.colorName || v.colorCode || 'Option'
                            return (
                                <button
                                    key={v.colorId}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => !disabled && handleColor(v.colorId)}
                                    className={pillClass(active, disabled)}
                                >
                                    {thumb(v)}
                                    <span className="max-w-[200px] text-left leading-tight">{label}</span>
                                    {active && !disabled ? <SelectedCheck /> : null}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {showSize && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                    <span className="w-20 shrink-0 pt-2 text-gray-500 sm:w-24">Size</span>
                    <div className="flex flex-wrap gap-2">
                        {sizeOptions.map((v) => {
                            const disabled = v.shopStock <= 0
                            const active = v.sizeId === selected?.sizeId
                            const label = v.sizeName || v.sizeCode || 'Size'
                            return (
                                <button
                                    key={`${v.colorId}-${v.sizeId}`}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => !disabled && handleSize(v.sizeId)}
                                    className={pillClass(active, disabled)}
                                >
                                    {label}
                                    {active && !disabled ? <SelectedCheck /> : null}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductVariantSelector