import { productClient } from "@/lib/api/productClient";
import type { Shop, ShopSearchPagination } from "../types/shopTypes";

type ProductShopRow = {
  id: string;
  name: string;
  slug?: string | null;
  isActive?: boolean;
  shopStatus?: { code?: string; label?: string } | null;
};

type ProductShopSearchResponse = {
  success: boolean;
  data: ProductShopRow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const emptyPagination = (perPage: number, page: number): ShopSearchPagination => ({
  total: 0,
  per_page: perPage,
  current_page: page,
  last_page: 1,
});

const mapShop = (shop: ProductShopRow): Shop => ({
  id: shop.id,
  name: shop.name,
  domain: shop.slug?.trim() || null,
  status: shop.shopStatus?.code ?? (shop.isActive === false ? "inactive" : "active"),
});

export const shopApi = {
  searchPublic: async (params: {
    search: string;
    page?: number;
    perPage?: number;
  }): Promise<{ shops: Shop[]; pagination: ShopSearchPagination }> => {
    const search = params.search.trim();
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 20;
    if (!search) {
      return {
        shops: [],
        pagination: emptyPagination(perPage, page),
      };
    }

    const response = await productClient.get<ProductShopSearchResponse>("/shops", {
      params: {
        search,
        page,
        limit: perPage,
      },
    });

    const shops = (response.data?.data ?? []).map(mapShop);
    const pagination = response.data?.pagination;

    return {
      shops,
      pagination: pagination
        ? {
            total: pagination.total,
            per_page: pagination.limit,
            current_page: pagination.page,
            last_page: pagination.totalPages,
          }
        : emptyPagination(perPage, page),
    };
  },
};
