export const AUTH_SERVICE_BASE_URL =
    import.meta.env.VITE_AUTH_SERVICE_URL ?? 'http://localhost:8000/api/v1'

const getOAuthBaseUrl = (): string => {
    const base = AUTH_SERVICE_BASE_URL
    if (base.startsWith('http://') || base.startsWith('https://')) return base
    return 'http://localhost:8000/api/v1'
}

export const getOAuthRedirectUrl = (provider: 'google' | 'facebook'): string =>
    `${getOAuthBaseUrl()}/oauth/${provider}/redirect`

export const ORDER_SERVICE_BASE_URL =
    import.meta.env.VITE_ORDER_SERVICE_URL ?? 'http://localhost:8001/api'

export const PRODUCT_SERVICE_BASE_URL =
    import.meta.env.VITE_PRODUCT_SERVICE_URL ?? 'http://localhost:5001/api/v1'

export const ASSET_BASE_URL = (
    import.meta.env.VITE_ASSET_BASE_URL ??
    PRODUCT_SERVICE_BASE_URL.replace(/\/api\/v\d+(?:\/.*)?$/i, '')
).replace(/\/+$/, '')

const isLocalAssetBase = /^(https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?$/i.test(
    ASSET_BASE_URL,
)

/**
 * Product-service JSON often returns path-only media URLs (`/uploads/...`). Local development
 * keeps that path on the local product server; production uses the configured CDN layout.
 */
export function productServiceAssetUrl(path: string | undefined | null): string {
    if (path == null) return ''

    const trimmed = String(path).trim()
    if (trimmed === '') return ''

    // Browser-generated URLs do not belong to either asset server.
    if (/^(data:|blob:)/i.test(trimmed)) return trimmed

    let assetPath = trimmed
    if (/^https?:\/\//i.test(trimmed)) {
        try {
            assetPath = new URL(trimmed).pathname
        } catch {
            return ''
        }
    }

    const normalizedPath = `/${assetPath.replace(/^\/+/, '')}`
    const serverPath = isLocalAssetBase
        ? normalizedPath
        : normalizedPath.replace(/^\/uploads\//i, '/')

    return `${ASSET_BASE_URL}${serverPath}`
}

export const ECOMMERCE_READ_SERVICE_BASE_URL =
    import.meta.env.VITE_ECOMMERCE_READ_SERVICE_URL ?? 'http://localhost:5004'

export const ECOMMERCE_READ_GRAPHQL_URL =
    import.meta.env.VITE_ECOMMERCE_READ_GRAPHQL_URL ?? `${ECOMMERCE_READ_SERVICE_BASE_URL}/graphql`

/** Shipping microservice (shop profiles + calculate). */
export const SHIPPING_SERVICE_BASE_URL =
    import.meta.env.VITE_SHIPPING_SERVICE_URL ?? 'http://localhost:5020/api/v1'