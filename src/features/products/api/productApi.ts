import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { ecommerceReadRestClient } from '@/lib/api/ecommerceReadRestClient'
import type { AxiosResponse } from 'axios'
import type { ProductVariant } from '@/features/products/types/productTypes'

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
        price: number
        images?: string[]
        categoryId: string
        category?: {
            id: string
            name: string
            slug: string
            parentId: string | null
        }
        shop: {
            id: string
            name: string
            slug: string
        }
        currency: string
        minPrice: number
        maxPrice: number
        brandName: string
        primaryVariantId: string | null
        variants: ProductVariant[]
    }
}

type GraphQLErrorItem = { message?: string }
type GraphQLEnvelope<TData> = { data?: TData; errors?: GraphQLErrorItem[] }

type CatalogProductGraphItem = {
    productId: string
    title: string
    price: number
    images?: string[]
    /** Read model may set this while `images` is still empty (event ordering). */
    imageUrl?: string
    categoryId: string
}

type CatalogProductsGraphQLData = {
    catalogProducts?: {
        items: CatalogProductGraphItem[]
        page: number
        limit: number
        total: number
    }
}

type CatalogProductByIdGraphQLData = {
    catalogProductById: CatalogProductDetailGraph | null
}

type CatalogVariantGraph = {
    variantId: string
    sku: string
    price: number
    basePrice: number
    profitThresholdPercent: number
    discountPercent: number
    listPrice: number
    compareAtPrice: number | null
    effectiveSellingPrice: number
    shopStock: number
    isPrimary: boolean
    colorId: string
    colorName: string
    colorCode: string
    sizeId: string
    sizeName: string
    sizeCode: string
    imageIndexes?: number[] | null
}

type CatalogProductDetailGraph = {
    productId: string
    slug: string
    title: string
    description: string
    sku: string
    price: number
    minPrice: number
    maxPrice: number
    primaryVariantId: string | null
    brandName: string
    shopAvailableStock: number
    totalAvailableStock: number
    currency: string
    categoryId: string
    categoryName: string
    categorySlug: string
    parentCategoryId: string
    parentCategoryName: string
    parentCategorySlug: string
    shopId: string
    images: string[]
    imageUrl: string
    variants: CatalogVariantGraph[]
}

const CATALOG_PRODUCTS_BY_CATEGORY_QUERY = `
  query CatalogProducts($page: Int!, $limit: Int!, $categoryId: ID) {
    catalogProducts(page: $page, limit: $limit, categoryId: $categoryId) {
      items {
        productId
        title
        price
        images
        imageUrl
        categoryId
      }
      page
      limit
      total
    }
  }
`

const CATALOG_PRODUCT_BY_ID_QUERY = `
  query CatalogProductById($productId: ID!) {
    catalogProductById(productId: $productId) {
      productId
      slug
      title
      description
      sku
      price
      minPrice
      maxPrice
      primaryVariantId
      brandName
      shopAvailableStock
      totalAvailableStock
      currency
      categoryId
      categoryName
      categorySlug
      parentCategoryId
      parentCategoryName
      parentCategorySlug
      shopId
      images
      imageUrl
      variants {
        variantId
        sku
        price
        basePrice
        profitThresholdPercent
        discountPercent
        listPrice
        compareAtPrice
        effectiveSellingPrice
        shopStock
        isPrimary
        colorId
        colorName
        colorCode
        sizeId
        sizeName
        sizeCode
        imageIndexes
      }
    }
  }
`

const PAGE_LIMIT = 100

async function postGraphQL<TData>(query: string, variables: Record<string, unknown>): Promise<TData> {
    const response = await ecommerceReadRestClient.post<GraphQLEnvelope<TData>>('/graphql', {
        query,
        variables,
    })

    const graphQLErrors = response.data?.errors ?? []
    if (graphQLErrors.length > 0) {
        const firstMessage = graphQLErrors[0]?.message || 'GraphQL request failed.'
        throw new Error(firstMessage)
    }

    const data = response.data?.data
    if (!data) {
        throw new Error('Empty GraphQL response.')
    }
    return data
}

async function fetchCatalogProductsGraphQL(categoryId: string): Promise<CatalogProductGraphItem[]> {
    const collected: CatalogProductGraphItem[] = []
    let page = 1
    let totalPages = 1

    do {
        const data = await postGraphQL<CatalogProductsGraphQLData>(
            CATALOG_PRODUCTS_BY_CATEGORY_QUERY,
            {
                page,
                limit: PAGE_LIMIT,
                categoryId,
            },
        )

        const payload = data.catalogProducts
        const items = payload?.items ?? []
        const total = payload?.total ?? items.length
        const limit = payload?.limit ?? PAGE_LIMIT
        collected.push(...items)
        totalPages = Math.max(1, Math.ceil(total / limit))
        page += 1
    } while (page <= totalPages)

    return collected
}

function buildImages(p: CatalogProductDetailGraph): string[] {
    if (Array.isArray(p.images) && p.images.length > 0) {
        return p.images.map((u) => productServiceAssetUrl(String(u)))
    }
    if (p.imageUrl && String(p.imageUrl).trim() !== '') {
        return [productServiceAssetUrl(String(p.imageUrl))]
    }
    return []
}

/** Catalog list: same as detail — `images` may be empty while `imageUrl` is set in Mongo read model. */
function buildCatalogListImages(row: CatalogProductGraphItem): string[] {
    if (Array.isArray(row.images) && row.images.length > 0) {
        return row.images.map((u) => productServiceAssetUrl(String(u)))
    }
    if (row.imageUrl && String(row.imageUrl).trim() !== '') {
        return [productServiceAssetUrl(String(row.imageUrl))]
    }
    return []
}

/**
 * Read model has shopId only (no shop name). Cart uses a generic label until events include shop metadata.
 */
function shopPlaceholder(shopId: string): { id: string; name: string; slug: string } {
    const id = shopId.trim() || 'unknown'
    return {
        id,
        name: 'Seller store',
        slug: id,
    }
}

function normalizeImageIndexes(raw: unknown): number[] | undefined {
    if (!Array.isArray(raw) || raw.length === 0) return undefined
    const out: number[] = []
    for (const x of raw) {
        const n = typeof x === 'number' ? x : Number(x)
        if (Number.isFinite(n) && Number.isInteger(n) && n >= 0) out.push(n)
    }
    return out.length > 0 ? out : undefined
}

function mapGraphVariant(v: CatalogVariantGraph): ProductVariant {
    const price = Number(v.effectiveSellingPrice ?? v.price ?? 0)
    const listPrice = Number(v.listPrice ?? price)
    const compareRaw = v.compareAtPrice
    const compareAtPrice =
        compareRaw !== null && compareRaw !== undefined && !Number.isNaN(Number(compareRaw))
            ? Number(compareRaw)
            : null
    const imageIndexes = normalizeImageIndexes(v.imageIndexes)

    return {
        variantId: v.variantId,
        sku: v.sku ?? '',
        price,
        listPrice,
        compareAtPrice,
        effectiveSellingPrice: Number(v.effectiveSellingPrice ?? v.price ?? 0),
        shopStock: Math.max(0, Math.floor(Number(v.shopStock ?? 0))),
        isPrimary: Boolean(v.isPrimary),
        colorId: v.colorId ?? '',
        colorName: v.colorName ?? '',
        colorCode: v.colorCode ?? '',
        sizeId: v.sizeId ?? '',
        sizeName: v.sizeName ?? '',
        sizeCode: v.sizeCode ?? '',
        ...(imageIndexes ? { imageIndexes } : {}),
    }
}

export const productApi = {
    /**
     * Buyer category listing: ecommerce-read-service GraphQL → MongoDB `product_reads`.
     */
    getByCategory: async (categoryId: string): Promise<AxiosResponse<ProductsApiResponse>> => {
        const normalized = categoryId.trim()
        if (!normalized) {
            throw new Error('Category id is required.')
        }

        const rows = await fetchCatalogProductsGraphQL(normalized)
        const data: ProductsApiResponse = {
            success: true,
            data: rows.map((row) => ({
                id: row.productId,
                name: row.title,
                price: row.price,
                images: buildCatalogListImages(row),
                categoryId: row.categoryId ?? '',
            })),
        }

        return {
            data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as never,
        } as AxiosResponse<ProductsApiResponse>
    },

    /**
     * Buyer product detail: same read projection as listing (consistent pricing/stock with catalog).
     */
    getDetail: async (productId: string): Promise<AxiosResponse<ProductDetailApiResponse>> => {
        const normalized = productId.trim()
        if (!normalized) {
            throw new Error('Product id is required.')
        }

        const data = await postGraphQL<CatalogProductByIdGraphQLData>(CATALOG_PRODUCT_BY_ID_QUERY, {
            productId: normalized,
        })

        const p = data.catalogProductById
        if (!p) {
            const err = new Error('Product not found.') as Error & { status?: number }
            err.status = 404
            throw err
        }

        const stock =
            typeof p.totalAvailableStock === 'number'
                ? p.totalAvailableStock
                : typeof p.shopAvailableStock === 'number'
                  ? p.shopAvailableStock
                  : 0

        const parentId = p.parentCategoryId?.trim() ? p.parentCategoryId : null
        const variants = (p.variants ?? []).map(mapGraphVariant)
        const minPrice = Number(p.minPrice ?? p.price ?? 0)
        const maxPrice = Number(p.maxPrice ?? p.price ?? 0)
        const displayPrice = variants.length === 1 ? variants[0].price : minPrice

        const detail: ProductDetailApiResponse = {
            success: true,
            data: {
                id: p.productId,
                name: p.title,
                slug: p.slug,
                description: p.description,
                sku: p.sku,
                stock,
                price: displayPrice,
                images: buildImages(p),
                categoryId: p.categoryId,
                category: {
                    id: p.categoryId,
                    name: p.categoryName,
                    slug: p.categorySlug,
                    parentId,
                },
                shop: shopPlaceholder(p.shopId),
                currency: p.currency ?? 'USD',
                minPrice,
                maxPrice,
                brandName: p.brandName ?? '',
                primaryVariantId: p.primaryVariantId?.trim() ? p.primaryVariantId : null,
                variants,
            },
        }

        return {
            data: detail,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as never,
        } as AxiosResponse<ProductDetailApiResponse>
    },
}