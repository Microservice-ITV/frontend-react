import { createAsyncThunk } from '@reduxjs/toolkit'
import { productApi } from '@/features/products/api/productApi'
import type { Product } from '../types/productTypes'

// Raw API response type (price comes as string from API)
interface RawProduct {
    id: string
    name: string
    description?: string
    price: string | number
    sku?: string
    images?: string
    categoryId: string
    [key: string]: any
}

interface ProductsApiResponse {
    success: boolean
    data: RawProduct[]
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export const fetchProductsByCategory = createAsyncThunk<
    Product[],
    string,
    { rejectValue: string }
>('products/fetchByCategory', async (categoryId, { rejectWithValue }) => {
    try {
        const response = await productApi.get<ProductsApiResponse>('/products', {
            params: { categoryId },
        })
        // Extract the data array and normalize price from string to number
        const products: Product[] = response.data.data.map((product) => ({
            id: product.id,
            name: product.name,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            images: product.images[0],
            categoryId: product.categoryId,
        }))
        return products
    } catch (error: any) {
        const message =
            error?.response?.data?.message || error.message || 'Failed to load products'
        return rejectWithValue(message)
    }
})