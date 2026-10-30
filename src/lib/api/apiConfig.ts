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

const isLocalAssetBase =
    /^(https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?$/i.test(
        ASSET_BASE_URL,
    )

export function productServiceAssetUrl(
    path: string | undefined | null,
): string {
    if (path == null) return ''

    const trimmed = String(path).trim()

    if (!trimmed) return ''

    if (/^(data:|blob:)/i.test(trimmed)) {
        return trimmed
    }

    const cdnBaseUrl = import.meta.env.VITE_APP_ENV === 'local'
        ? 'http://localhost:5001/uploads'
        : 'https://dnistore.sgp1.cdn.digitaloceanspaces.com'
    if (
        /^https:\/\/dnistore\.sgp1\.cdn\.digitaloceanspaces\.com\//i.test(
            trimmed,
        )
    ) {
        return trimmed
    }

    let assetPath = trimmed

    if (/^https?:\/\//i.test(trimmed)) {
        try {
            const url = new URL(trimmed)
            const productUrl = new URL(PRODUCT_SERVICE_BASE_URL)

            if (url.origin === productUrl.origin) {
                assetPath = url.pathname

                if (productUrl.pathname !== '/') {
                    assetPath = assetPath.replace(
                        new RegExp(`^${productUrl.pathname}`),
                        '',
                    )
                }
            } else {
                return trimmed
            }
        } catch {
            return ''
        }
    }

    assetPath = assetPath
        .replace(/^\/+/, '')
        .replace(/^dnistore\//i, '')
        .replace(/^uploads\//i, '')

    if (isLocalAssetBase) {
        const localBase = PRODUCT_SERVICE_BASE_URL
            .replace(/\/api\/v\d+(?:\/.*)?$/i, '')
            .replace(/\/+$/, '')

        return `${localBase}/uploads/${assetPath}`
    }

    return `${ASSET_BASE_URL}/${assetPath}`
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
