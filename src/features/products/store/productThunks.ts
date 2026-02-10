import { createAsyncThunk } from '@reduxjs/toolkit'
import { productQueries } from '@/features/products/api/productQueries'
import type { Product, ProductDetail } from '../types/productTypes'
// import { AxiosResponse } from 'axios'

/* ------------------------------
   LIST PRODUCTS BY CATEGORY
-------------------------------- */
export const fetchProductsByCategory = createAsyncThunk<
    Product[],
    string,
    { rejectValue: string }
>('products/fetchByCategory', async (categoryId, { rejectWithValue }) => {
    try {
        const response = await productQueries.getByCategory(categoryId)
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
export const fetchProductDetail = createAsyncThunk<
    ProductDetail,
    string,
    { rejectValue: string }
>('products/productDetail', async (productId, { rejectWithValue }) => {
    try {
        const response = await productQueries.getDetail(productId) // as AxiosResponse<ProductDetailApiResponse> // ()
        const product = response.data.data

        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            sku: product.sku,
            stock: product.stock,
            price: Number(product.price),
            images: product.images ?? [],
            categoryId: product.categoryId,
            category: {
                id: product.category.id,
                name: product.category.name,
                slug: product.category.slug,
                parentId: product.category.parentId ?? null,
            },

            shop: {
                id: product.shop.id,
                name: product.shop.name,
                slug: product.shop.slug,
            },
        }
    } catch (err: any) {
        return rejectWithValue(err.message || 'Failed to load product')
    }
})