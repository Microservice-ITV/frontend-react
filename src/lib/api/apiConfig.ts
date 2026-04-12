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

export const ECOMMERCE_READ_SERVICE_BASE_URL =
    import.meta.env.VITE_ECOMMERCE_READ_SERVICE_URL ?? 'http://localhost:5004'

export const ECOMMERCE_READ_GRAPHQL_URL =
    import.meta.env.VITE_ECOMMERCE_READ_GRAPHQL_URL ?? `${ECOMMERCE_READ_SERVICE_BASE_URL}/graphql`

/** Shipping microservice (shop profiles + calculate). */
export const SHIPPING_SERVICE_BASE_URL =
    import.meta.env.VITE_SHIPPING_SERVICE_URL ?? 'http://localhost:5005/api/v1'