import { createAsyncThunk } from '@reduxjs/toolkit'
import { productApi } from '../api/productApi'
import type { Product, ProductDetail } from '../types/productTypes'

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
        const products: Product[] = response.data.data.map((product) => ({
            id: product.id,
            name: product.name,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            images: product.images ?? [],
            categoryId: product.categoryId,
        }))
        return products
    } catch (error: unknown) {
        const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            (error instanceof Error ? error.message : 'Failed to load products')
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
        const response = await productApi.getDetail(productId)
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
            category: product.category
                ? {
                      id: product.category.id,
                      name: product.category.name,
                      slug: product.category.slug,
                      parentId: product.category.parentId ?? null,
                  }
                : undefined,
            shop: {
                id: product.shop.id,
                name: product.shop.name,
                slug: product.shop.slug,
            },
            currency: product.currency,
            minPrice: product.minPrice,
            maxPrice: product.maxPrice,
            brandName: product.brandName,
            primaryVariantId: product.primaryVariantId,
            variants: product.variants ?? [],
        }
    } catch (err: unknown) {
        const message =
            err instanceof Error ? err.message : 'Failed to load product'
        return rejectWithValue(message)
    }
})