export interface TopOrderedProduct {
    id: string
    name: string
    image: string
    price?: number
    currency?: string
    totalOrdered: number
}

export type TopOrderedProductsStatus = 'loading' | 'success' | 'empty' | 'error'