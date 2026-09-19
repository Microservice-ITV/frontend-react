export interface ProductsApiResponse {
    success: boolean
    data: RawProduct[]
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface RawProduct {
    id: string
    name: string
    description?: string
    price: string | number
    sku?: string
    images?: string[]
    categoryId: string
    tags?: string[]
}