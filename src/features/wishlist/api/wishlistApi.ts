import type { ProductDetail } from "@/features/products/types/productTypes";
import { productClient } from "@/lib/api/productClient";
import { productServiceAssetUrl } from "@/lib/api/apiConfig";

type ProductServiceDetail = {
  id: string;
  name: string;
  description?: string;
  price?: number | string;
  minPrice?: number | string;
  maxPrice?: number | string;
  images?: string[];
  categoryId: string;
  slug?: string;
  sku?: string;
  stock?: number;
  primaryVariantId?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
  };
  shop?: { id: string; name: string; slug: string };
  brand?: { name?: string };
};

const fromProductService = (raw: ProductServiceDetail): ProductDetail => {
  const price = Number(raw.price ?? raw.minPrice ?? 0);

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug ?? raw.id,
    description: raw.description,
    sku: raw.sku,
    stock: raw.stock,
    price,
    images: (raw.images ?? []).map(productServiceAssetUrl).filter(Boolean),
    categoryId: raw.categoryId,
    category: raw.category,
    shop: raw.shop ?? { id: "", name: "", slug: "" },
    currency: "MMK",
    minPrice: Number(raw.minPrice ?? price),
    maxPrice: Number(raw.maxPrice ?? price),
    brandName: raw.brand?.name ?? "",
    primaryVariantId: raw.primaryVariantId ?? null,
    variants: [],
  };
};

const fetchFromProductService = async (
  productId: string,
): Promise<ProductDetail> => {
  const response = await productClient.get<{
    success: boolean;
    data: ProductServiceDetail;
  }>(`/products/${encodeURIComponent(productId)}`);
  return fromProductService(response.data.data);
};

const fetchWithConcurrency = async <T>(
  values: string[],
  worker: (value: string) => Promise<T>,
  concurrency: number,
): Promise<PromiseSettledResult<T>[]> => {
  const results: PromiseSettledResult<T>[] = [];
  let nextIndex = 0;

  const runWorker = async () => {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      try {
        results[index] = {
          status: "fulfilled",
          value: await worker(values[index]),
        };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, runWorker),
  );
  return results;
};

/**
 * Fetches full product details for a list of wishlist product ids.
 *
 * Wishlist cards only need the product-service projection. Loading from one
 * service avoids a read-model request followed by a fallback request for each
 * product, while the concurrency cap protects the browser and API.
 */
export const wishlistApi = {
  fetchProductDetails: async (
    productIds: string[],
  ): Promise<ProductDetail[]> => {
    const uniqueIds = [...new Set(productIds.filter(Boolean))];

    const results = await fetchWithConcurrency(
      uniqueIds,
      fetchFromProductService,
      6,
    );

    const details: ProductDetail[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        details.push(result.value);
      }
    }

    if (details.length === 0 && uniqueIds.length > 0) {
      throw new Error(
        "Wishlist products could not be loaded. Please try again.",
      );
    }

    return details;
  },
};

function toProductDetail(raw: {
  id: string;
  name: string;
  slug: string;
  description?: string;
  videoUrl?: string;
  sku?: string;
  stock?: number;
  price: number;
  images?: string[];
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
  };
  shop: {
    id: string;
    name: string;
    slug: string;
  };
  currency: string;
  minPrice: number;
  maxPrice: number;
  brandName: string;
  primaryVariantId: string | null;
  variants: ProductDetail["variants"];
}): ProductDetail {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    videoUrl: raw.videoUrl,
    sku: raw.sku,
    stock: raw.stock,
    price: Number(raw.price),
    images: raw.images ?? [],
    categoryId: raw.categoryId,
    category: raw.category,
    shop: raw.shop,
    currency: raw.currency,
    minPrice: Number(raw.minPrice),
    maxPrice: Number(raw.maxPrice),
    brandName: raw.brandName,
    primaryVariantId: raw.primaryVariantId,
    variants: raw.variants ?? [],
  };
}
