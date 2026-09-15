import { productClient } from "@/lib/api/productClient";

export interface ServerWishlistItem {
  productId: string;
  createdAt?: string;
}

export interface WishlistPageResponse {
  items: ServerWishlistItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

/**
 * Server-side wishlist (product-service `/api/v1/wishlist`).
 * The backend derives the user id from the JWT, so the frontend never
 * passes it explicitly — the auth interceptor attaches the Bearer token.
 */
export const wishlistServerApi = {
  list: async (page = 1, limit = 50): Promise<WishlistPageResponse> => {
    const res = await productClient.get<{
      success: boolean;
      data: ServerWishlistItem[];
      pagination?: WishlistPageResponse["pagination"];
    }>("/wishlist", { params: { page, limit } });
    const items = res.data?.data ?? [];
    const pagination = res.data?.pagination ?? {
      page,
      limit,
      total: items.length,
      totalPages: 1,
      hasNextPage: false,
    };
    return { items, pagination };
  },

  listAll: async (limit = 100): Promise<ServerWishlistItem[]> => {
    const items: ServerWishlistItem[] = [];
    let page = 1;

    do {
      const result = await wishlistServerApi.list(page, limit);
      items.push(...result.items);
      if (!result.pagination.hasNextPage) break;
      page += 1;
    } while (true);

    return items;
  },

  add: async (productId: string): Promise<void> => {
    await productClient.post("/wishlist", { productId });
  },

  remove: async (productId: string): Promise<void> => {
    await productClient.delete(`/wishlist/${encodeURIComponent(productId)}`);
  },

  clear: async (): Promise<void> => {
    await productClient.delete("/wishlist");
  },

  writeAll: async (productIds: string[]): Promise<ServerWishlistItem[]> => {
    const res = await productClient.put<{
      success: boolean;
      data: ServerWishlistItem[];
    }>("/wishlist", { items: productIds });
    return res.data?.data ?? [];
  },
};
