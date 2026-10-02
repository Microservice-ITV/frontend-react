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
    'http://localhost:5030/api/v1/tax'

export const INVOICE_SERVICE_BASE_URL =
    import.meta.env.VITE_INVOICE_SERVICE_URL ??
    'http://localhost:5005/api/v1'

export const PROMOTION_SERVICE_BASE_URL =
    import.meta.env.VITE_PROMOTION_SERVICE_URL ??
    'http://localhost:5007'

export const ACCOUNTING_SERVICE_BASE_URL =
    import.meta.env.VITE_ACCOUNTING_SERVICE_URL ??
    'http://localhost:4005/api/v1'

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