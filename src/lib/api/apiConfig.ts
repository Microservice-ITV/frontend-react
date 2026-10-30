export const AUTH_SERVICE_BASE_URL =
    import.meta.env.VITE_AUTH_SERVICE_URL ??
    'http://localhost:8000/api/v1'

const getOAuthBaseUrl = (): string => {
    const base = AUTH_SERVICE_BASE_URL

    if (base.startsWith('http://') || base.startsWith('https://')) {
        return base
    }

    return 'http://localhost:8000/api/v1'
}

export const getOAuthRedirectUrl = (
    provider: 'google' | 'facebook',
): string => `${getOAuthBaseUrl()}/oauth/${provider}/redirect`

export const PRODUCT_SERVICE_BASE_URL =
    import.meta.env.VITE_PRODUCT_SERVICE_URL ??
    'http://localhost:5001/api/v1'

export const ORDER_SERVICE_BASE_URL =
    import.meta.env.VITE_ORDER_SERVICE_URL ??
    'http://localhost:5005/api/v1'

export const PAYMENT_SERVICE_BASE_URL =
    import.meta.env.VITE_PAYMENT_SERVICE_URL ??
    'http://localhost:5003/api/v1'

export const SHIPPING_SERVICE_BASE_URL =
    import.meta.env.VITE_SHIPPING_SERVICE_URL ??
    'http://localhost:5020/api/v1'

export const TAX_SERVICE_BASE_URL =
    import.meta.env.VITE_TAX_SERVICE_URL ??
    'http://localhost:5030/api/v1'

export const INVOICE_SERVICE_BASE_URL =
    import.meta.env.VITE_INVOICE_SERVICE_URL ??
    'http://localhost:5006/api/v1'

export const PROMOTION_SERVICE_BASE_URL =
    import.meta.env.VITE_PROMOTION_SERVICE_URL ??
    'http://localhost:5007'

export const ACCOUNTING_SERVICE_BASE_URL =
    import.meta.env.VITE_ACCOUNTING_SERVICE_URL ??
    'http://localhost:4005/api/v1'

export const WAREHOUSE_SERVICE_BASE_URL =
    import.meta.env.VITE_WAREHOUSE_SERVICE_URL ??
    'http://localhost:5002/api/v1'

export const ECOMMERCE_READ_SERVICE_BASE_URL =
    import.meta.env.VITE_ECOMMERCE_READ_SERVICE_URL ??
    'http://localhost:5004'

export const ECOMMERCE_READ_GRAPHQL_URL =
    import.meta.env.VITE_ECOMMERCE_READ_GRAPHQL_URL ??
    `${ECOMMERCE_READ_SERVICE_BASE_URL}/graphql`

export const ASSET_BASE_URL = (
    import.meta.env.VITE_ASSET_BASE_URL ??
    PRODUCT_SERVICE_BASE_URL.replace(/\/api\/v\d+(?:\/.*)?$/i, '')
).replace(/\/+$/, '')

/** Same-origin Spaces proxy path — Network shows `/dnistore/...`, not digitaloceanspaces.com. */
export const DNISTORE_ASSET_PREFIX = '/dnistore'

const isLocalAssetBase =
    /^(https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?$/i.test(
        ASSET_BASE_URL,
    ) || import.meta.env.VITE_APP_ENV === 'local'

const isDigitalOceanSpacesUrl = (value: string): boolean =>
    /(?:^https?:\/\/)?(?:[\w.-]+\.)?digitaloceanspaces\.com(?:\/|$)/i.test(
        value,
    )

/**
 * Normalize any stored/API image value to `categories/foo.webp` (no bucket, no uploads/).
 */
function extractAssetObjectKey(path: string): string {
    let assetPath = path.trim()

    if (/^https?:\/\//i.test(assetPath)) {
        try {
            assetPath = new URL(assetPath).pathname
        } catch {
            return ''
        }
    }

    assetPath = assetPath.replace(/^\/+/, '')

    while (/^uploads\//i.test(assetPath)) {
        assetPath = assetPath.replace(/^uploads\//i, '')
    }
    while (/^dnistore\//i.test(assetPath)) {
        assetPath = assetPath.replace(/^dnistore\//i, '')
    }

    return assetPath
}

export function productServiceAssetUrl(
    path: string | undefined | null,
): string {
    if (path == null) return ''

    const trimmed = String(path).trim()

    if (!trimmed) return ''

    if (/^(data:|blob:)/i.test(trimmed)) {
        return trimmed
    }

    // Already same-origin proxied path.
    if (/^\/dnistore\//i.test(trimmed)) {
        return trimmed.split(/[?#]/, 1)[0]
    }

    let candidate = trimmed

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const url = new URL(trimmed)
            const productUrl = new URL(PRODUCT_SERVICE_BASE_URL)
            const isProductOrigin = url.origin === productUrl.origin
            const isSpaces = isDigitalOceanSpacesUrl(trimmed)

            if (!isProductOrigin && !isSpaces) {
                // Unrelated absolute URL (e.g. external placeholder).
                return trimmed
            }

            candidate = url.pathname
            if (isProductOrigin && productUrl.pathname !== '/') {
                candidate = candidate.replace(
                    new RegExp(`^${productUrl.pathname}`),
                    '',
                )
            }
        } catch {
            return ''
        }
    }

    const assetKey = extractAssetObjectKey(candidate)
    if (!assetKey) return ''

    if (isLocalAssetBase) {
        const localBase = PRODUCT_SERVICE_BASE_URL
            .replace(/\/api\/v\d+(?:\/.*)?$/i, '')
            .replace(/\/+$/, '')

        return `${localBase}/uploads/${assetKey}`
    }

    // Production: relative `/dnistore/categories/...` (proxied by nginx → Spaces/CDN).
    return `${DNISTORE_ASSET_PREFIX}/${assetKey}`
}

export type ProductImageVariant = 'thumb' | 'card' | 'full'

const VARIANT_WIDTH: Record<ProductImageVariant, number> = {
    thumb: 200,
    card: 600,
    full: 1200,
}

const VARIANT_PATH_RE = /-(thumb|card|full)\.webp(?=[?#]|$)/i

/** Swap `-full.webp` / `-card.webp` / `-thumb.webp` for the requested size. Legacy URLs unchanged. */
export function productImageVariantUrl(
    path: string | undefined | null,
    variant: ProductImageVariant = 'card',
): string {
    const url = productServiceAssetUrl(path)
    if (!url) return ''
    if (!VARIANT_PATH_RE.test(url)) return url
    return url.replace(VARIANT_PATH_RE, `-${variant}.webp`)
}

/** Browser picks phone vs desktop size when the asset has multi-size uploads. */
export function productImageSrcSet(
    path: string | undefined | null,
): string | undefined {
    const url = productServiceAssetUrl(path)
    if (!url || !VARIANT_PATH_RE.test(url)) return undefined

    return (Object.keys(VARIANT_WIDTH) as ProductImageVariant[])
        .map((variant) => `${productImageVariantUrl(path, variant)} ${VARIANT_WIDTH[variant]}w`)
        .join(', ')
}
