import { authClient } from "@/lib/api/authClient";
import type { Shop, ShopSearchPagination } from "../types/shopTypes";

type PublicShopSearchResponse = {
  success: boolean;
  data: {
    shops: Shop[];
    pagination: ShopSearchPagination;
  };
};

export const shopApi = {
  searchPublic: async (params: {
    search: string;
    page?: number;
    perPage?: number;
  }): Promise<{ shops: Shop[]; pagination: ShopSearchPagination }> => {
    const search = params.search.trim();
    if (!search) {
      return {
        shops: [],
        pagination: {
          total: 0,
          per_page: params.perPage ?? 20,
          current_page: params.page ?? 1,
          last_page: 1,
        },
      };
    }

    const response = await authClient.get<PublicShopSearchResponse>("/shops/public", {
      params: {
        search,
        ...(params.page ? { page: params.page } : {}),
        ...(params.perPage ? { per_page: params.perPage } : {}),
      },
    });

    const payload = response.data?.data;
    return {
      shops: payload?.shops ?? [],
      pagination:
        payload?.pagination ??
        ({
          total: 0,
          per_page: params.perPage ?? 20,
          current_page: params.page ?? 1,
          last_page: 1,
        } as ShopSearchPagination),
    };
  },
};

