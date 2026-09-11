import { ecommerceReadRestClient } from '@/lib/api/ecommerceReadRestClient'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import type { AxiosResponse } from 'axios'
import type { Product } from '../types/productTypes'

function buildRecommendationImages(product: any): string[] {
    if (Array.isArray(product.images) && product.images.length > 0) {
        return product.images.map((u: string) => productServiceAssetUrl(String(u)))
    }
    if (product.imageUrl && String(product.imageUrl).trim() !== '') {
        return [productServiceAssetUrl(String(product.imageUrl))]
    }
    return []
}

// API RESPONSE TYPES
interface RelatedProductsApiResponse {
    success: boolean
    data: Product[]
}

interface BroughtTogetherProductsApiResponse {
    success: boolean
    data: Product[]
}

export const recommendationApi = {
    /**
     * Fetch related products for a given product ID
     * Calls ecommerce-read-service: GET /products/:productId/related
     */
    getRelatedProducts: async (productId: string): Promise<AxiosResponse<RelatedProductsApiResponse>> => {
        const normalized = productId.trim()
        if (!normalized) {
            throw new Error('Product ID is required.')
        }

        const response = await ecommerceReadRestClient.get(`/catalog/products/${normalized}/related`)
        const products = response.data.products.map((product: any) => ({
            id: product._id,
            name: product.title,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            images: buildRecommendationImages(product),
            categoryId: product.categoryId,
            tags: product.tags || [],
        }))

        return {
            data: {
                success: true,
                data: products,
            },
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            config: {} as never,
        } as AxiosResponse<RelatedProductsApiResponse>
    },

    /**
     * Fetch brought-together products for a given product ID
     * Calls ecommerce-read-service: GET /catalog/products/:productId/brought-together
     */
    getBroughtTogetherProducts: async (productId: string): Promise<AxiosResponse<BroughtTogetherProductsApiResponse>> => {
        const normalized = productId.trim()
        if (!normalized) {
            throw new Error('Product ID is required.')
        }

        const response = await ecommerceReadRestClient.get(`/catalog/products/${normalized}/brought-together`)
        const products = response.data.products.map((product: any) => ({
            id: product._id,
            name: product.title,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            images: buildRecommendationImages(product),
            categoryId: product.categoryId,
            tags: product.tags || [],
        }))

        return {
            data: {
                success: true,
                data: products,
                source: response.data.source ?? 'related',
            },
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            config: {} as never,
        } as AxiosResponse<BroughtTogetherProductsApiResponse>
    },
}