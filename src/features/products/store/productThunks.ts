import { createAsyncThunk } from '@reduxjs/toolkit'
import { productApi } from '@/features/products/api/productApi'
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
        const response = await productApi.getByCategory(categoryId)
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
        const response = await productApi.getDetail(productId) // as AxiosResponse<ProductDetailApiResponse> // ()
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
            category: product.category,
        }
    } catch (err: any) {
        return rejectWithValue(err.message || 'Failed to load product')
    }
})