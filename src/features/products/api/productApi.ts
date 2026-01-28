import { catalogApi } from '@/lib/api/catalogApi'
import { AxiosResponse } from 'axios'

// API RESPONSE TYPES (RAW BACKEND)
interface ProductsApiResponse {
    success: boolean
    data: {
        id: string
        name: string
        price: string | number
        images?: string[]
        categoryId: string
    }[]
}

interface ProductDetailApiResponse {
    success: boolean
    data: {
        id: string
        name: string
        slug: string
        description?: string
        sku?: string
        stock?: number
        price: string | number
        images?: string[]
        categoryId: string
        category?: {
            id: string
            name: string
            slug: string
            parentId: string | null
        }
    }
}

export const productApi = {
    getByCategory: (categoryId: string): Promise<AxiosResponse<ProductsApiResponse>> =>
        catalogApi.get('/products', {
            params: { categoryId },
        }),

    getDetail: (productId: string): Promise<AxiosResponse<ProductDetailApiResponse>> =>
        catalogApi.get(`/products/${productId}`),
}