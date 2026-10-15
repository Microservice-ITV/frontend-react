import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { productClient } from '@/lib/api/productClient'
import type { ProductVariant } from '@/features/products/types/productTypes'
import { variantSellableStock as sellable } from '@/features/products/utils/variantStock'

type SizeOption = { id: string; code: string; name: string }

function isPlaceholderSize(code: string, name: string): boolean {
    const key = (code || name).trim().toUpperCase()
    return key === 'DEF' || key === 'DEFAULT'
}

function hasLabel(value: string | undefined | null): boolean {
    return Boolean(value?.trim())
}

function sizeButtonClass(onProduct: boolean, outOfStock: boolean, active: boolean): string {
    // Only sizes not sold on this product look disabled. In-stock vs OOS is shown
    // in the Stock row — gray text made XL look unavailable even when it has colors.
    const tone = !onProduct ? 'text-gray-300' : 'text-gray-900'
    const border = active ? 'relative z-10 border-gray-800' : 'border-gray-200'
    const hover = onProduct && !active ? 'hover:border-gray-300' : ''
    const cursor = onProduct ? 'cursor-pointer' : 'cursor-not-allowed'
    const strike = onProduct && outOfStock && !active ? 'line-through decoration-gray-300' : ''
    return `flex h-12 w-16 shrink-0 items-center justify-center border bg-white text-sm ${cursor} ${tone} ${border} ${hover} ${strike}`
}

function uniqBySize(variants: ProductVariant[]): ProductVariant[] {
    const seen = new Set<string>()
    return variants.filter((v) => {
        if (seen.has(v.sizeId)) return false
        seen.add(v.sizeId)
        return true
    })
}

function uniqByColorForSize(variants: ProductVariant[], sizeId: string): ProductVariant[] {
    const rows = variants.filter((v) => v.sizeId === sizeId)
    const seen = new Set<string>()
    return rows.filter((v) => {
        if (seen.has(v.colorId)) return false
        seen.add(v.colorId)
        return true
    })
}

export function pickDefaultVariant(variants: ProductVariant[]): ProductVariant | null {
    if (variants.length === 0) return null
    const primaryOk = variants.find((v) => v.isPrimary && sellable(v) > 0)
    if (primaryOk) return primaryOk
    const inStock = variants.find((v) => sellable(v) > 0)
    return inStock ?? variants[0] ?? null
}

/** Label for a SKU when color/size are missing or duplicated in the read model. */
export function variantDisplayLabel(v: ProductVariant): string {
    const parts = [v.colorName, v.sizeName].filter((s) => s && s.trim())
    if (parts.length) return parts.join(' · ')
    if (v.sku?.trim()) return v.sku.trim()
    return 'Option'
}

function HoverTip({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
    return (
        <span className={['group/tip relative inline-flex', className].filter(Boolean).join(' ')}>
            {children}
            <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100"
            >
                {label}
                <span
                    className="absolute left-1/2 top-full -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-gray-800"
                    aria-hidden
                />
            </span>
        </span>
    )
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

const SWATCH_ALIASES: Record<string, string> = {
    navy: '#000080',
    offwhite: '#f4f1ea',
    cream: '#fffdd0',
    ivory: '#fffff0',
    beige: '#f5f5dc',
    burgundy: '#800020',
    maroon: '#800000',
    teal: '#008080',
    olive: '#808000',
    gold: '#d4af37',
    silver: '#c0c0c0',
    grey: '#808080',
    gray: '#808080',
}

const CSS_COLOR_NAMES = new Set([
    'white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'pink', 'purple',
    'brown', 'navy', 'gray', 'grey', 'beige', 'gold', 'silver', 'maroon', 'teal',
    'cyan', 'magenta', 'lime', 'aqua', 'coral', 'ivory', 'khaki', 'tan', 'salmon',
    'indigo', 'violet', 'turquoise', 'chocolate', 'crimson', 'lavender', 'lightblue',
    'lightgreen', 'lightgray', 'lightgrey', 'darkblue', 'darkgreen', 'darkred',
    'darkgray', 'darkgrey', 'skyblue',
])

const LIGHT_SWATCHES = new Set([
    'white', 'ivory', 'cream', 'beige', 'yellow', 'khaki', 'lightyellow', 'snow',
    'offwhite', '#ffffff', '#fff', '#fffff0', '#fffdd0', '#f4f1ea', '#f5f5dc', '#c0c0c0',
])

/** Paint a circle from the color name. Codes like WHT are not CSS colors. */
function swatchColor(name: string, code: string): string {
    const trimmedCode = code.trim()
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmedCode)) return trimmedCode
    const key = name.trim().toLowerCase().replace(/[\s_-]+/g, '')
    if (SWATCH_ALIASES[key]) return SWATCH_ALIASES[key]
    if (CSS_COLOR_NAMES.has(key)) return key
    if (!key) return '#d1d5db'
    let hash = 0
    for (let i = 0; i < key.length; i += 1) hash = key.charCodeAt(i) + ((hash << 5) - hash)
    return `hsl(${Math.abs(hash) % 360} 42% 46%)`
}

function isLightSwatch(color: string): boolean {
    const value = color.toLowerCase()
    if (LIGHT_SWATCHES.has(value)) return true
    const hex = value.match(/^#([0-9a-f]{6})$/)
    if (!hex) return false
    const n = Number.parseInt(hex[1], 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    return (r * 299 + g * 587 + b * 114) / 1000 > 180
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
    const [catalogSizes, setCatalogSizes] = useState<SizeOption[]>([])

    useEffect(() => {
        let cancelled = false
        productClient
            .get<{ data?: Array<{ id?: string; code?: string; name?: string }> }>('/sizes', {
                params: { limit: 100 },
            })
            .then((res) => {
                if (cancelled) return
                const rows = Array.isArray(res.data?.data) ? res.data.data : []
                setCatalogSizes(
                    rows
                        .filter((size) => Boolean(size.id))
                        .map((size) => ({
                            id: size.id as string,
                            code: size.code ?? '',
                            name: size.name ?? '',
                        })),
                )
            })
            .catch(() => {
                if (!cancelled) setCatalogSizes([])
            })
        return () => {
            cancelled = true
        }
    }, [])

    // Reset when navigating products or when the SKU set changes (use variantSig, not variants ref)
    useEffect(() => {
        setSelectedVariantId(pickDefaultVariant(variants)?.variantId ?? '')
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

    const sizeOptions = useMemo(() => {
        const byId = new Map<string, SizeOption>()
        const ordered: SizeOption[] = []
        for (const size of catalogSizes) {
            if (isPlaceholderSize(size.code, size.name)) continue
            byId.set(size.id, size)
            ordered.push(size)
        }
        for (const variant of uniqBySize(variants)) {
            if (byId.has(variant.sizeId) || isPlaceholderSize(variant.sizeCode || '', variant.sizeName || '')) continue
            ordered.push({
                id: variant.sizeId,
                code: variant.sizeCode || '',
                name: variant.sizeName || '',
            })
        }
        return ordered
    }, [catalogSizes, variants])
    const currentSizeId = selected?.sizeId ?? ''

    const lastEmitted = useRef<string | undefined>(undefined)
    useEffect(() => {
        const id = selected?.variantId
        if (id === lastEmitted.current) return
        lastEmitted.current = id
        onVariantChange(selected ?? null)
    }, [onVariantChange, selected])
    const colorOptions = useMemo(
        () => (currentSizeId ? uniqByColorForSize(variants, currentSizeId) : []),
        [variants, currentSizeId],
    )

    const showColor = colorOptions.some((v) => hasLabel(v.colorName) || hasLabel(v.colorCode))
    const showSize = sizeOptions.some((size) => hasLabel(size.name) || hasLabel(size.code))
    const showFallback = variants.length > 1 && !showColor && !showSize

    const handleColor = (nextColorId: string) => {
        const matches = variants.filter(
            (v) => v.colorId === nextColorId && (!currentSizeId || v.sizeId === currentSizeId),
        )
        if (matches.length === 0) return
        const pick = pickDefaultVariant(matches) ?? matches[0]
        setSelectedVariantId(pick.variantId)
    }

    const handleSize = (nextSizeId: string) => {
        const withSize = variants.filter((v) => v.sizeId === nextSizeId)
        if (withSize.length === 0) return
        const cur = variants.find((v) => v.variantId === selectedVariantId)
        const preferColor = cur?.colorId
        const sameColor =
            preferColor &&
            withSize.find((v) => v.colorId === preferColor && sellable(v) > 0)
        const pick = sameColor || pickDefaultVariant(withSize) || withSize[0]
        setSelectedVariantId(pick.variantId)
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
                            const disabled = sellable(v) <= 0
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

            {showSize && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <span className="w-20 shrink-0 text-sm font-medium text-gray-900 sm:w-24">Size:</span>
                    <div className="inline-flex max-w-full flex-nowrap overflow-x-auto">
                        {sizeOptions.map((size) => {
                            const onProduct = variants.some((x) => x.sizeId === size.id)
                            const outOfStock =
                                onProduct &&
                                !variants.some((x) => x.sizeId === size.id && sellable(x) > 0)
                            const active = onProduct && size.id === currentSizeId
                            const label = size.code.trim() || size.name.trim() || 'Size'
                            const tip = size.name.trim() || label
                            return (
                                <HoverTip
                                    key={size.id}
                                    label={tip}
                                    className="-ml-px first:ml-0"
                                >
                                    <button
                                        type="button"
                                        disabled={!onProduct}
                                        aria-label={tip}
                                        aria-pressed={active}
                                        onClick={() => handleSize(size.id)}
                                        className={sizeButtonClass(onProduct, outOfStock, active)}
                                    >
                                        {label}
                                    </button>
                                </HoverTip>
                            )
                        })}
                    </div>
                </div>
            )}

            {showColor && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <span className="w-20 shrink-0 text-sm font-medium text-gray-900 sm:w-24">Color:</span>
                    <div className="flex flex-wrap items-center gap-3">
                        {colorOptions.map((v) => {
                            const inStock = variants.some(
                                (x) =>
                                    x.colorId === v.colorId &&
                                    x.sizeId === currentSizeId &&
                                    sellable(x) > 0,
                            )
                            const active =
                                v.colorId === selected?.colorId && selected?.sizeId === currentSizeId
                            const label = v.colorName || v.colorCode || 'Option'
                            const fill = swatchColor(v.colorName, v.colorCode)
                            const light = isLightSwatch(fill)
                            return (
                                <HoverTip key={v.colorId} label={label}>
                                    <button
                                        type="button"
                                        aria-label={label}
                                        aria-pressed={active}
                                        onClick={() => handleColor(v.colorId)}
                                        className={[
                                            'relative h-8 w-8 rounded-full border transition cursor-pointer',
                                            light ? 'border-gray-300' : 'border-transparent',
                                            !inStock ? 'opacity-45' : '',
                                            active ? 'ring-2 ring-gray-400 ring-offset-2' : '',
                                        ].join(' ')}
                                        style={{ backgroundColor: fill }}
                                    >
                                        {active ? (
                                            <span
                                                className={`pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold leading-none ${
                                                    light ? 'text-gray-900' : 'text-white'
                                                }`}
                                                aria-hidden
                                            >
                                                ✓
                                            </span>
                                        ) : null}
                                    </button>
                                </HoverTip>
                            )
                        })}
                    </div>
                </div>
            )}

            {showSize && !showColor && (
                <p className="text-sm text-gray-500">No color available for this size.</p>
            )}
        </div>
    )
}

export default ProductVariantSelector