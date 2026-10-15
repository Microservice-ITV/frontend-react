import { ecommerceReadRestClient } from "@/lib/api/ecommerceReadRestClient";
import { productClient } from "@/lib/api/productClient";
import { AxiosError } from "axios";

export type CatalogProductReadItem = {
  productId: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  stock?: number;
  shopAvailableStock?: number;
  currency: string;
  categoryId?: string;
  categoryName?: string;
  category?: {
    id?: string;
    name?: string;
    title?: string;
  };
  shopId?: string;
  shop_id?: string;
  shop?: {
    id?: string;
  };
  isActive: boolean;
  createdAt?: string | { $date?: string };
  updatedAt?: string | { $date?: string };
};

type CatalogProductsApiResponse = {
  items: CatalogProductReadItem[];
  page: number;
  limit: number;
  total: number;
};

/** Row from product-service `GET /products` (Prisma; `createdAt` desc). */
export type ProductServiceProductListItem = {
  id: string;
  name: string;
  description?: string | null;
  slug: string;
  price: number | string;
  stock?: number;
  warehouseStockMirror?: number;
  /** Shop + warehouse available (from product-service). */
  availableStock?: number;
  categoryId: string;
  category?: { id?: string; name?: string; title?: string };
  isActive: boolean;
  createdAt?: string;
};

type ProductServicePaginatedResponse = {
  success?: boolean;
  data?: ProductServiceProductListItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CatalogRefItem = {
  id: string;
  name: string;
  code?: string;
};

/** Matches product-service `variantInputSchema` / Postman (basePrice + optional markup/discount). */
export type SellerProductVariantPayload = {
  id?: string;
  colorId: string;
  sizeId: string;
  basePrice: number;
  /** Selling/list price before any discount. */
  listPrice: number;
  profitThresholdPercent?: number;
  discountPercent?: number;
  stock: number;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  isPrimary?: boolean;
};

type CreateSellerProductPayload = {
  name: string;
  description?: string;
  tags?: string[];
  slug: string;
  categoryId: string;
  shopId: string;
  brandId: string;
  variants: SellerProductVariantPayload[];
  isActive: boolean;
  imageFiles?: File[];
};

type UpdateSellerProductPayload = Partial<{
  name: string;
  description: string;
  tags: string[];
  slug: string;
  categoryId: string;
  shopId: string;
  brandId: string;
  variants: SellerProductVariantPayload[];
  isActive: boolean;
  imageFiles: File[];
  existingImageUrls: string[];
}>;

export type ProductDetailReadItem = {
  id?: string;
  productId?: string;
  name?: string;
  title?: string;
  slug?: string;
  sku?: string;
  description?: string;
  categoryId?: string;
  category?: {
    id?: string;
    name?: string;
    title?: string;
    parent?: { id?: string; name?: string } | null;
  };
  shopId?: string;
  shop?: { id?: string; name?: string };
  brandId?: string;
  brand?: { id?: string; name?: string; code?: string };
  isActive?: boolean;
  imageUrl?: string;
  images?: string[];
  tags?: string[];
  stock?: number | string;
  warehouseStockMirror?: number | string;
  availableStock?: number | string;
  createdAt?: string;
  updatedAt?: string;
  variants?: Array<{
    id?: string
    variantId?: string
    sku?: string
    colorId?: string
    sizeId?: string
    color?: { id?: string; name?: string; code?: string }
    size?: { id?: string; name?: string; code?: string }
    basePrice?: number | string
    listPrice?: number | string
    sellingPrice?: number | string
    profitThresholdPercent?: number | string
    discountPercent?: number | string
    effectiveSellingPrice?: number | string
    /** Customer-facing unit price (same as effectiveSellingPrice from API formatter). */
    price?: number | string;
    stock?: number | string;
    shopStock?: number | string;
    warehouseStockMirror?: number | string;
    availableStock?: number | string;
    length?: number | string | null;
    width?: number | string | null;
    height?: number | string | null;
    weight?: number | string | null;
    imageIndexes?: number[]
    isPrimary?: boolean;
  }>;
};

type GraphQLErrorItem = {
  message?: string;
};

type CatalogProductsGraphQLData = {
  catalogProducts?: CatalogProductsApiResponse;
};

type GraphQLEnvelope<TData> = {
  data?: TData;
  errors?: GraphQLErrorItem[];
};

const CATALOG_PRODUCTS_QUERY = `
  query CatalogProducts($page: Int!, $limit: Int!) {
    catalogProducts(page: $page, limit: $limit) {
      items {
        productId
        slug
        title
        description
        price
        stock: shopAvailableStock
        currency
        categoryId
        categoryName
        shopId
        isActive
        createdAt
        updatedAt
      }
      page
      limit
      total
    }
  }
`;

export const sellerProductApi = {
  listCatalogProducts(
    params: { page?: number; limit?: number } = {},
  ): Promise<{ data: CatalogProductsApiResponse }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    return ecommerceReadRestClient
      .post<GraphQLEnvelope<CatalogProductsGraphQLData>>("/graphql", {
        query: CATALOG_PRODUCTS_QUERY,
        variables: { page, limit },
      })
      .then((response) => {
        const graphQLErrors = response.data?.errors ?? [];
        if (graphQLErrors.length > 0) {
          const firstMessage =
            graphQLErrors[0]?.message || "GraphQL request failed.";
          throw new Error(firstMessage);
        }

        const payload = response.data?.data?.catalogProducts;
        return {
          data: payload ?? {
            items: [],
            page,
            limit,
            total: 0,
          },
        };
      })
      .catch((error: unknown) => {
        // When GraphQL validation/runtime fails, many servers return HTTP 400
        // with details in `errors[]` instead of `message`.
        const axiosError = error as AxiosError<GraphQLEnvelope<unknown>>;
        const firstGraphQlMessage =
          axiosError.response?.data?.errors?.[0]?.message;
        if (firstGraphQlMessage) {
          throw new Error(firstGraphQlMessage);
        }
        throw error;
      });
  },

  /**
   * Lists products for a shop from product-service (source of truth after create/update).
   * Prefer this over {@link listCatalogProducts} for the seller dashboard list so new products appear immediately.
   */
  listProductsByShop(params: {
    shopId: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 100, 100);
    return productClient.get<ProductServicePaginatedResponse>("/products", {
      params: { shopId: params.shopId, page, limit },
    });
  },

  listBrands() {
    return productClient.get<{ success?: boolean; data?: CatalogRefItem[] }>(
      "/brands",
    );
  },

  listColors() {
    return productClient.get<{ success?: boolean; data?: CatalogRefItem[] }>(
      "/colors",
    );
  },

  listSizes() {
    return productClient.get<{ success?: boolean; data?: CatalogRefItem[] }>(
      "/sizes",
    );
  },

  createProduct(payload: CreateSellerProductPayload) {
    const formData = new FormData();
    formData.append("name", payload.name);
    if (payload.description) {
      formData.append("description", payload.description);
    }
    if (payload.tags && payload.tags.length > 0) {
      formData.append("tags", JSON.stringify(payload.tags));
    }
    formData.append("slug", payload.slug);
    formData.append("categoryId", payload.categoryId);
    formData.append("shopId", payload.shopId);
    formData.append("brandId", payload.brandId);
    formData.append("variants", JSON.stringify(payload.variants));
    formData.append("isActive", String(payload.isActive));

    payload.imageFiles?.forEach((file) => {
      formData.append("images", file);
    });

    return productClient.post("/products", formData);
  },

  getProductById(id: string) {
    return productClient.get<{
      success?: boolean;
      data?: ProductDetailReadItem;
    }>(`/products/${id}`);
  },

  updateProduct(id: string, payload: UpdateSellerProductPayload) {
    const formData = new FormData();
    if (payload.name !== undefined) formData.append("name", payload.name);
    if (payload.description !== undefined)
      formData.append("description", payload.description);
    if (payload.tags !== undefined)
      formData.append("tags", JSON.stringify(payload.tags));
    if (payload.slug !== undefined) formData.append("slug", payload.slug);
    if (payload.categoryId !== undefined)
      formData.append("categoryId", payload.categoryId);
    if (payload.shopId !== undefined) formData.append("shopId", payload.shopId);
    if (payload.brandId !== undefined)
      formData.append("brandId", payload.brandId);
    if (payload.variants !== undefined)
      formData.append("variants", JSON.stringify(payload.variants));
    if (payload.isActive !== undefined)
      formData.append("isActive", String(payload.isActive));

    const nextImageFiles = payload.imageFiles ?? [];
    if (payload.existingImageUrls !== undefined) {
      // Send retained URLs separately so an empty list can explicitly delete
      // every old image while new files are uploaded in the same request.
      formData.append(
        "existingImageUrls",
        JSON.stringify(payload.existingImageUrls),
      );
    }
    if (nextImageFiles.length > 0) {
      nextImageFiles.forEach((file) => {
        formData.append("images", file);
      });
    } else if (
      payload.existingImageUrls !== undefined &&
      payload.existingImageUrls.length > 0
    ) {
      payload.existingImageUrls.forEach((url) =>
        formData.append("images", url),
      );
    }

    return productClient.patch(`/products/${id}`, formData);
  },

  deleteProduct(id: string) {
    return productClient.delete<{ success?: boolean; message?: string }>(
      `/products/${id}`,
    );
  },
};
