import { createAsyncThunk } from '@reduxjs/toolkit'
import { productApi } from '@/features/products/api/productApi'
import type { Product, ProductDetail } from '../types/productTypes'

/* ------------------------------
   LIST PRODUCTS BY CATEGORY
-------------------------------- */
// Raw API response type (price comes as string from API)
interface RawProduct {
    id: string
    name: string
    price: string | number
    images?: string[]
    categoryId: string
}

interface ProductsApiResponse {
    success: boolean
    data: RawProduct[]
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
            images: product.images ?? [],
            categoryId: product.categoryId,
        }))
        return products
    } catch (error: any) {
        const message =
            error?.response?.data?.message || error.message || 'Failed to load products'
        return rejectWithValue(message)
    }
})


/* ------------------------------
   PRODUCT DETAIL
-------------------------------- */
interface ProductDetailApiResponse {
    success: boolean
    data: {
        id: string
        name: string
        description?: string
        sku?: string
        stock?: number
        price: string | number
        images?: string[]
        categoryId: string
        categories?: {
            id: string
            name: string
            slug: string
        }[]
    }
}

export const fetchProductDetail = createAsyncThunk<
    ProductDetail,
    string,
    { rejectValue: string }
>('products/fetchDetail', async (productId, { rejectWithValue }) => {
    try {
        const response = await productApi.get(`/products/${productId}`)
        const p = response.data.data

        return {
            id: p.id,
            name: p.name,
            description: p.description,
            sku: p.sku,
            stock: p.stock,
            slug: p.slug,
            price: Number(p.price),
            images: p.images ?? [],
            categoryId: p.categoryId,
            category: p.category,
        }
    } catch (err: any) {
        return rejectWithValue(err.message || 'Failed to load product')
    }
})