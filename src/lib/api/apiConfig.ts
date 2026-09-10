export const AUTH_SERVICE_BASE_URL =
    import.meta.env.VITE_AUTH_SERVICE_URL ?? 'http://localhost:8000/api/v1'

export const PRODUCT_SERVICE_BASE_URL =
    import.meta.env.VITE_PRODUCT_SERVICE_URL ?? 'http://localhost:5001/api/v1'

export const ORDER_SERVICE_BASE_URL =
    import.meta.env.VITE_ORDER_SERVICE_URL ?? 'http://localhost:5005/api/v1'

export const ECOMMERCE_READ_SERVICE_BASE_URL =
    import.meta.env.VITE_ECOMMERCE_READ_SERVICE_URL ?? 'http://localhost:5004'

export const ECOMMERCE_READ_GRAPHQL_URL =
    import.meta.env.VITE_ECOMMERCE_READ_GRAPHQL_URL ??
    `${ECOMMERCE_READ_SERVICE_BASE_URL}/graphql`

export const ASSET_BASE_URL = (
    import.meta.env.VITE_ASSET_BASE_URL ??
    PRODUCT_SERVICE_BASE_URL.replace(/\/api\/v\d+(?:\/.*)?$/i, '')
).replace(/\/+$/, '')

const isLocal =
    /^(https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?$/i.test(
        ASSET_BASE_URL,
    )

export function productServiceAssetUrl(
    path: string | undefined | null,
): string {
    if (!path) return ''

    const value = String(path).trim()

    if (!value) return ''

    if (/^(data:|blob:)/i.test(value)) {
        return value
    }

    if (
        /^https:\/\/dnistore\.sgp1\.cdn\.digitaloceanspaces\.com\//i.test(
            value,
        )
    ) {
        return value
    }

    let normalizedPath = value

    if (/^https?:\/\//i.test(value)) {
        try {
            const url = new URL(value)
            const productUrl = new URL(PRODUCT_SERVICE_BASE_URL)

            if (url.origin === productUrl.origin) {
                normalizedPath = url.pathname

                if (productUrl.pathname !== '/') {
                    normalizedPath = normalizedPath.replace(
                        new RegExp(`^${productUrl.pathname}`),
                        '',
                    )
                }
            } else {
                return value
            }
        } catch {
            return value
        }
    }

    normalizedPath = normalizedPath
        .replace(/^\/+/, '')
        .replace(/^dnistore\//i, '')
        .replace(/^uploads\//i, '')

    if (isLocal) {
        const localBase = PRODUCT_SERVICE_BASE_URL
            .replace(/\/api\/v\d+(?:\/.*)?$/i, '')
            .replace(/\/+$/, '')

        return `${localBase}/uploads/${normalizedPath}`
    }

    return `${ASSET_BASE_URL}/${normalizedPath}`
}