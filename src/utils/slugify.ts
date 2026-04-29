/** Match product-service shop slug: lowercase, hyphen-separated alphanumerics. */
export const slugifyShopSegment = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
