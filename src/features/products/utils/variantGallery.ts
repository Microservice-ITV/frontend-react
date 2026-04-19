import type { ProductVariant } from '@/features/products/types/productTypes'

/**
 * Maps `variant.imageIndexes` onto the product `images` array (read-model order).
 * Falls back to all images when indexes are missing or none resolve.
 */
export function getGalleryImagesForVariant(
    allImages: string[],
    variant: ProductVariant | null,
): string[] {
    const safe = allImages.length > 0 ? allImages : []
    const idxs = variant?.imageIndexes
    if (!idxs?.length) return safe

    const picked: string[] = []
    const seen = new Set<number>()
    for (const raw of idxs) {
        const i = typeof raw === 'number' ? raw : Number(raw)
        if (!Number.isInteger(i) || i < 0 || i >= safe.length) continue
        if (seen.has(i)) continue
        seen.add(i)
        const url = safe[i]
        if (url) picked.push(url)
    }
    return picked.length > 0 ? picked : safe
}
