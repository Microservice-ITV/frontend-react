import type { WishlistItem } from '../types/wishlistTypes'

/** Cache of the wishlist for the currently logged-in user. */
export const USER_WISHLIST_KEY = 'dni_wishlist'
/** Anonymous/guest wishlist (only meaningful while logged out). */
export const ANON_WISHLIST_KEY = 'dni_wishlist_anon'

function normalizeStoredItem(raw: Partial<WishlistItem>): WishlistItem | null {
    const productId = String(raw.productId ?? '').trim()
    if (!productId) return null
    return { productId }
}

function loadFrom(key: string): WishlistItem[] {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return []

        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []

        const seen = new Set<string>()
        const items: WishlistItem[] = []
        for (const row of parsed) {
            const item = normalizeStoredItem(row as Partial<WishlistItem>)
            if (!item || seen.has(item.productId)) continue
            seen.add(item.productId)
            items.push(item)
        }
        return items
    } catch {
        return []
    }
}

function saveTo(key: string, items: WishlistItem[]) {
    try {
        localStorage.setItem(key, JSON.stringify(items))
    } catch {
        // Ignore quota / privacy-mode errors; in-memory state still works.
    }
}

export const loadUserWishlist = (): WishlistItem[] => loadFrom(USER_WISHLIST_KEY)
export const saveUserWishlist = (items: WishlistItem[]) => saveTo(USER_WISHLIST_KEY, items)
export const loadAnonWishlist = (): WishlistItem[] => loadFrom(ANON_WISHLIST_KEY)
export const saveAnonWishlist = (items: WishlistItem[]) => saveTo(ANON_WISHLIST_KEY, items)

// Backwards-compatible aliases (default active key = user cache).
export const loadWishlist = loadUserWishlist
export const saveWishlist = saveUserWishlist