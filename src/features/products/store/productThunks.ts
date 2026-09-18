import { createAsyncThunk } from '@reduxjs/toolkit'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { productApi } from '../api/productApi'
import type { Product, ProductDetail } from '../types/productTypes'

const RECENT_PRODUCTS_LIMIT = 10

/* ------------------------------
   SEARCH PRODUCTS
--------------------------------- */
export const searchProducts = createAsyncThunk<
  Product[],
  { query: string; sort?: string; categoryId?: string },
  { rejectValue: string }
>(
  "products/search",
  async ({ query, sort, categoryId }, { rejectWithValue }) => {
    try {
      const response = await productApi.search(query, sort, categoryId);
      return response.data.data.map((product) => ({
        id: product.id,
        name: product.name,
        price:
          typeof product.price === "string"
            ? parseFloat(product.price)
            : product.price,
        images: product.images ?? [],
        categoryId: product.categoryId,
        tags: product.tags ?? [],
      }));
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ??
        (error instanceof Error ? error.message : "Search failed");
      return rejectWithValue(message);
    }
  },
);

/* ------------------------------
   LIST PRODUCTS BY CATEGORY
------------------------------- */
export const fetchProductsByCategory = createAsyncThunk<
    Product[],
    { categoryId: string; sort?: string },
    { rejectValue: string }
>('products/fetchByCategory', async ({ categoryId, sort }, { rejectWithValue }) => {
    try {
        const response = await productApi.getByCategory(categoryId, sort)
        const products: Product[] = response.data.data.map((product) => ({
            id: product.id,
            name: product.name,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            images: product.images ?? [],
            categoryId: product.categoryId,
            tags: product.tags ?? [],
        }))
        return products
    } catch (error: unknown) {
        const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            (error instanceof Error ? error.message : 'Failed to load products')
        return rejectWithValue(message)
    }
})

export const fetchRecentProducts = createAsyncThunk<
    { items: Product[]; hasNextPage: boolean; nextCursor: string | null },
    { cursor?: string },
    { rejectValue: string }
>('products/fetchRecentProducts', async ({ cursor }, { rejectWithValue }) => {
    try {
        const response = await productApi.getRecentProducts(RECENT_PRODUCTS_LIMIT, cursor)

        return {
            items: response.items.map((product) => ({
                id: product.id,
                name: product.name,
                price: Number(product.price),
                images: product.image
                    ? [productServiceAssetUrl(product.image)]
                    : (product.images ?? []).map((image) => productServiceAssetUrl(image)),
                categoryId: product.categoryId ?? '',
                tags: product.tags ?? [],
            })),
            hasNextPage: response.hasNextPage,
            nextCursor: response.nextCursor,
        }
    } catch (error: unknown) {
        const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            (error instanceof Error ? error.message : 'Failed to load recently added products')
        return rejectWithValue(message)
    }
}, {
    condition: ({ cursor }, { getState }) => {
        const state = getState() as { products: {
            recentProductsLoading: boolean
            recentProductsStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
            recentProductsNextCursor: string | null
            recentProductsHasNextPage: boolean
            recentProductsLoadedCursors: string[]
        } }

        if (state.products.recentProductsLoading) return false
        if (!cursor && state.products.recentProductsStatus !== 'idle') return false
        if (cursor && !state.products.recentProductsHasNextPage) return false
        if (cursor && state.products.recentProductsLoadedCursors.includes(cursor)) return false
        return !cursor || state.products.recentProductsNextCursor === cursor
    },
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
            videoUrl: product.videoUrl,
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
            tags: product.tags ?? [],
        }
    } catch (err: unknown) {
        const message =
            err instanceof Error ? err.message : 'Failed to load product'
        return rejectWithValue(message)
    }
})