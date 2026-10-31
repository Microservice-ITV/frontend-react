import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { ecommerceReadRestClient } from '@/lib/api/ecommerceReadRestClient'
import type { AxiosResponse } from 'axios'
import { productClient } from '@/lib/api/productClient'
import type { ProductFlashDeal, ProductVariant } from '@/features/products/types/productTypes'
import { normalizeTags } from '@/features/products/utils/tagNormalization'

// API RESPONSE TYPES (RAW BACKEND)
interface ProductsApiResponse {
    success: boolean
    data: {
        id: string
        name: string
        price: string | number
        images?: string[]
        categoryId: string
        tags?: string[]
        stock?: number
    }[]
}

interface ProductDetailApiResponse {
    success: boolean
    data: {
        id: string
        name: string
        slug: string
        description?: string
        videoUrl?: string
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
        tags?: string[]
        flashDeals?: ProductFlashDeal[]
    }
}

export interface RecentProductApiItem {
    id: string
    name: string
    price: number | string
    image?: string
    images?: string[]
    categoryId?: string
    createdAt: string
    tags?: string[]
    shopAvailableStock?: number | null
    totalAvailableStock?: number | null
    stock?: number | null
    availabilityStatus?: string | null
}

export interface RecentProductsApiResponse {
    items: RecentProductApiItem[]
    hasNextPage: boolean
    nextCursor: string | null
}

type GraphQLErrorItem = { message?: string }
type GraphQLEnvelope<TData> = { data?: TData; errors?: GraphQLErrorItem[] }

type CatalogProductGraphItem = {
    productId: string
    title: string
    price: number
    tags?: string[]
    images?: string[]
    /** Read model may set this while `images` is still empty (event ordering). */
    imageUrl?: string
    categoryId: string
    categoryName?: string
    parentCategoryName?: string
    shopId?: string
    shopAvailableStock?: number | null
    totalAvailableStock?: number | null
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
    warehouseStock?: number
    isPrimary: boolean
    colorId: string
    colorName: string
    colorCode: string
    sizeId: string
    sizeName: string
    sizeCode: string
    length?: number | null
    width?: number | null
    height?: number | null
    weight?: number | null
    imageIndexes?: number[] | null
}

type CatalogProductDetailGraph = {
    productId: string
    slug: string
    title: string
    description: string
    videoUrl?: string | null
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
    tags?: string[]
    variants: CatalogVariantGraph[]
    activeFlashDeals?: CatalogFlashDealGraph[] | null
}

type CatalogFlashDealGraph = {
    flashDealId: string
    flashDealItemId: string
    variantId?: string | null
    dealPrice: number
    originalPrice: number
    discount: number
    startAt: string
    endAt: string
}

const CATALOG_PRODUCTS_BY_CATEGORY_QUERY = `
  query CatalogProducts($page: Int!, $limit: Int!, $categoryId: ID, $search: String, $sort: String) {
    catalogProducts(page: $page, limit: $limit, categoryId: $categoryId, search: $search, sort: $sort) {
      items {
        productId
        title
        price
        tags
        images
        imageUrl
        categoryId
        categoryName
        categorySlug
        parentCategoryName
        shopId
        shopAvailableStock
        totalAvailableStock
      }
      page
      limit
      total
    }
  }
`

/** Sellable list stock from ecommerce-read (shop + warehouse total when present). */
function mapListStock(item: {
  totalAvailableStock?: number | null
  shopAvailableStock?: number | null
  stock?: number | null
  availabilityStatus?: string | null
}): number | undefined {
  if (String(item.availabilityStatus ?? '').toUpperCase() === 'OUT_OF_STOCK') {
    return 0
  }
  if (typeof item.totalAvailableStock === 'number') {
    return Math.max(0, item.totalAvailableStock)
  }
  if (typeof item.shopAvailableStock === 'number') {
    return Math.max(0, item.shopAvailableStock)
  }
  if (typeof item.stock === 'number') {
    return Math.max(0, item.stock)
  }
  return undefined
}

const CATALOG_PRODUCT_BY_ID_QUERY = `
  query CatalogProductById($productId: ID!) {
    catalogProductById(productId: $productId) {
      productId
      slug
      title
      description
      videoUrl
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
      tags
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
        warehouseStock
        isPrimary
        colorId
        colorName
        colorCode
        sizeId
        sizeName
        sizeCode
        length
        width
        height
        weight
        imageIndexes
      }
      activeFlashDeals {
        flashDealId
        flashDealItemId
        variantId
        dealPrice
        originalPrice
        discount
        startAt
        endAt
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

async function fetchCatalogProductsGraphQL(
  categoryId?: string,
  search?: string,
  sort?: string,
): Promise<CatalogProductGraphItem[]> {
  const collected: CatalogProductGraphItem[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const data = await postGraphQL<CatalogProductsGraphQLData>(
      CATALOG_PRODUCTS_BY_CATEGORY_QUERY,
      {
        page,
        limit: PAGE_LIMIT,
        categoryId: categoryId || null,
        search: search || null,
        sort: sort || null,
      },
    );

    const payload = data.catalogProducts;
    const items = payload?.items ?? [];
    const total = payload?.total ?? items.length;
    const limit = payload?.limit ?? PAGE_LIMIT;
    collected.push(...items);
    totalPages = Math.max(1, Math.ceil(total / limit));
    page += 1;
  } while (page <= totalPages);

  return collected;
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
function shopPlaceholder(shopId: string, name?: string, slug?: string): { id: string; name: string; slug: string } {
    const id = shopId.trim() || 'unknown'
    return {
        id,
        name: name?.trim() || `Shop ${id.slice(0, 8)}`,
        slug: slug?.trim() || id,
    }
}

function toNullableDimension(raw: unknown): number | null {
    if (raw === null || raw === undefined || raw === '') return null
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
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

function mapGraphFlashDeal(deal: CatalogFlashDealGraph): ProductFlashDeal | null {
    const flashDealId = String(deal.flashDealId ?? '').trim()
    const flashDealItemId = String(deal.flashDealItemId ?? '').trim()
    if (!flashDealId || !flashDealItemId) return null
    const dealPrice = Number(deal.dealPrice)
    const originalPrice = Number(deal.originalPrice)
    if (!Number.isFinite(dealPrice) || !Number.isFinite(originalPrice)) return null
    const variantId = deal.variantId?.trim() ? deal.variantId.trim() : null
    return {
        flashDealId,
        flashDealItemId,
        variantId,
        dealPrice,
        originalPrice,
        discount: Math.max(0, Math.round(Number(deal.discount) || 0)),
        startAt: String(deal.startAt ?? ''),
        endAt: String(deal.endAt ?? ''),
    }
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
        warehouseStock: Math.max(0, Math.floor(Number(v.warehouseStock ?? 0))),
        isPrimary: Boolean(v.isPrimary),
        colorId: v.colorId ?? '',
        colorName: v.colorName ?? '',
        colorCode: v.colorCode ?? '',
        sizeId: v.sizeId ?? '',
        sizeName: v.sizeName ?? '',
        sizeCode: v.sizeCode ?? '',
        length: toNullableDimension(v.length),
        width: toNullableDimension(v.width),
        height: toNullableDimension(v.height),
        weight: toNullableDimension(v.weight),
        ...(imageIndexes ? { imageIndexes } : {}),
    }
}

export const productApi = {
  /**
   * Storefront search: keep products whose title or category name contain the query.
   * Backend also matches description (seed text includes "Shop slot"), which is too loose here.
   */
  search: async (
    query: string,
    sort?: string,
    categoryId?: string,
  ): Promise<AxiosResponse<ProductsApiResponse>> => {
    const normalized = query.trim();
    if (!normalized) {
      throw new Error("Search query is required.");
    }

    const rows = await fetchCatalogProductsGraphQL(
      categoryId?.trim() || undefined,
      normalized,
      sort,
    );
    const needle = normalized.toLowerCase();
    const visibleRows = rows.filter((row) => {
      const title = String(row.title ?? "").toLowerCase();
      const categoryName = String(row.categoryName ?? "").toLowerCase();
      const parentCategoryName = String(row.parentCategoryName ?? "").toLowerCase();
      return (
        title.includes(needle) ||
        categoryName.includes(needle) ||
        parentCategoryName.includes(needle)
      );
    });
    const data: ProductsApiResponse = {
      success: true,
      data: visibleRows.map((row) => {
        const stock = mapListStock(row)
        return {
          id: row.productId,
          name: row.title,
          price: row.price,
          tags: normalizeTags(row.tags),
          images: buildCatalogListImages(row),
          categoryId: row.categoryId ?? "",
          shopId: row.shopId?.trim() || undefined,
          ...(stock != null ? { stock } : {}),
        }
      }),
    };

    return {
      data,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as never,
    } as AxiosResponse<ProductsApiResponse>;
  },

  getRecentProducts: async (
    limit = 10,
    cursor?: string,
  ): Promise<RecentProductsApiResponse> => {
    const response =
      await ecommerceReadRestClient.get<RecentProductsApiResponse>(
        "/catalog/products/recent",
        {
          params: {
            limit,
            ...(cursor ? { cursor } : {}),
          },
        },
      );

    return response.data;
  },

  /**
   * Buyer category listing: ecommerce-read-service GraphQL → MongoDB `product_reads`.
   */
  getByCategory: async (
    categoryId: string,
    sort?: string,
  ): Promise<AxiosResponse<ProductsApiResponse>> => {
    const normalized = categoryId.trim();
    if (!normalized) {
      throw new Error("Category id is required.");
    }

    const rows = await fetchCatalogProductsGraphQL(normalized, undefined, sort);
    const data: ProductsApiResponse = {
      success: true,
      data: rows.map((row) => {
        const stock = mapListStock(row)
        return {
          id: row.productId,
          name: row.title,
          price: row.price,
          tags: normalizeTags(row.tags),
          images: buildCatalogListImages(row),
          categoryId: row.categoryId ?? "",
          shopId: row.shopId?.trim() || undefined,
          ...(stock != null ? { stock } : {}),
        }
      }),
    };

    return {
      data,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as never,
    } as AxiosResponse<ProductsApiResponse>;
  },

  /**
   * Buyer product detail: same read projection as listing (consistent pricing/stock with catalog).
   */
  getDetail: async (
    productId: string,
  ): Promise<AxiosResponse<ProductDetailApiResponse>> => {
    const normalized = productId.trim();
    if (!normalized) {
      throw new Error("Product id is required.");
    }

    const data = await postGraphQL<CatalogProductByIdGraphQLData>(
      CATALOG_PRODUCT_BY_ID_QUERY,
      {
        productId: normalized,
      },
    );

    const p = data.catalogProductById;
    if (!p) {
      const err = new Error("Product not found.") as Error & {
        status?: number;
      };
      err.status = 404;
      throw err;
    }

    const stock =
      typeof p.totalAvailableStock === "number"
        ? p.totalAvailableStock
        : typeof p.shopAvailableStock === "number"
          ? p.shopAvailableStock
          : 0;

    const parentId = p.parentCategoryId?.trim() ? p.parentCategoryId : null;
    let variants = (p.variants ?? []).map(mapGraphVariant);
    let minPrice = Number(p.minPrice ?? p.price ?? 0);
    let maxPrice = Number(p.maxPrice ?? p.price ?? 0);
    let shopName: string | undefined;
    let shopSlug: string | undefined;

    try {
      // Prefer live catalog pricing from product-service so inventory selling-price
      // edits show on the storefront even if ecommerce-read is briefly behind.
      const response = await productClient.get<{
        success: boolean;
        data?: {
          shop?: { name?: string; slug?: string };
          price?: number | string;
          minPrice?: number | string;
          maxPrice?: number | string;
          variants?: Array<{
            id?: string;
            variantId?: string;
            price?: number | string;
            listPrice?: number | string;
            effectiveSellingPrice?: number | string;
            compareAtPrice?: number | string | null;
          }>;
        };
      }>(`/products/${p.productId}`);
      const live = response.data.data;
      shopName = live?.shop?.name;
      shopSlug = live?.shop?.slug;
      if (live?.variants?.length) {
        const byId = new Map(
          live.variants.map((row) => [String(row.id ?? row.variantId ?? ''), row]),
        );
        variants = variants.map((variant) => {
          const row = byId.get(variant.variantId);
          if (!row) return variant;
          const effective = Number(
            row.effectiveSellingPrice ?? row.price ?? variant.price,
          );
          const listPrice = Number(row.listPrice ?? effective);
          const compareRaw = row.compareAtPrice;
          return {
            ...variant,
            price: Number.isFinite(effective) ? effective : variant.price,
            listPrice: Number.isFinite(listPrice) ? listPrice : variant.listPrice,
            effectiveSellingPrice: Number.isFinite(effective)
              ? effective
              : variant.effectiveSellingPrice,
            compareAtPrice:
              compareRaw !== null &&
              compareRaw !== undefined &&
              compareRaw !== '' &&
              Number.isFinite(Number(compareRaw))
                ? Number(compareRaw)
                : variant.compareAtPrice,
          };
        });
        const livePrices = variants.map((v) => v.price).filter((n) => Number.isFinite(n));
        if (livePrices.length > 0) {
          minPrice = Math.min(...livePrices);
          maxPrice = Math.max(...livePrices);
        } else {
          minPrice = Number(live.minPrice ?? minPrice);
          maxPrice = Number(live.maxPrice ?? maxPrice);
        }
      }
    } catch {
      // Keep the catalog detail usable if the product service is unavailable.
    }

    const displayPrice = variants.length === 1 ? variants[0].price : minPrice;

    const detail: ProductDetailApiResponse = {
      success: true,
      data: {
        id: p.productId,
        name: p.title,
        slug: p.slug,
        description: p.description,
        videoUrl: p.videoUrl?.trim() || undefined,
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
        shop: shopPlaceholder(p.shopId, shopName, shopSlug),
        currency: p.currency ?? "MMK",
        minPrice,
        maxPrice,
        brandName: p.brandName ?? "",
        primaryVariantId: p.primaryVariantId?.trim()
          ? p.primaryVariantId
          : null,
        variants,
        tags: normalizeTags(p.tags),
        flashDeals: (p.activeFlashDeals ?? [])
          .map(mapGraphFlashDeal)
          .filter((deal): deal is ProductFlashDeal => deal != null),
      },
    };

    return {
      data: detail,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as never,
    } as AxiosResponse<ProductDetailApiResponse>;
  },
};

/** Shop id and display name from product-service. Catalog cards do not include the shop name. */
export async function resolveProductShop(
  productId: string,
): Promise<{ shopId: string; shopName: string } | null> {
  const id = productId.trim();
  if (!id) return null;
  try {
    const response = await productClient.get<{
      success?: boolean;
      data?: { shopId?: string; shop?: { id?: string; name?: string } };
    }>(`/products/${id}`);
    const data = response.data?.data;
    const shopId = data?.shop?.id?.trim() || data?.shopId?.trim() || "";
    const shopName = data?.shop?.name?.trim() || "";
    if (!shopId || !shopName) return null;
    return { shopId, shopName };
  } catch {
    return null;
  }
}