import { promotionClient } from "@/lib/api/promotionClient";
import { productClient } from "@/lib/api/productClient";
import type { AxiosResponse } from "axios";

import type {
  FlashDeal,
  FlashDealListParams,
  FlashDealPagination,
  CreateFlashDealPayload,
  UpdateFlashDealPayload,
  UpdateFlashDealStockPayload,
  FlashDealLifecycleAction,
  ProductCatalogOption,
} from "../types/flashDealTypes";

interface ListApiResponse {
  success?: boolean;
  data?: FlashDeal[];
  pagination?: FlashDealPagination;
}

interface SingleApiResponse {
  success?: boolean;
  data?: FlashDeal;
}

interface MessageApiResponse {
  success?: boolean;
  data?: { id?: string; deleted?: boolean };
  message?: string;
}

interface ProductsApiResponse {
  success?: boolean;
  data?: Array<{
    id: string;
    name: string;
    slug: string;
    price: number | string;
    stock?: number;
    isActive?: boolean;
    categoryId?: string | null;
    category?: { id?: string; name?: string; title?: string } | null;
    shop?: { id?: string; name?: string } | null;
    images?: string[];
  }>;
  pagination?: FlashDealPagination;
}

const toProductOption = (
  row: NonNullable<ProductsApiResponse["data"]>[number],
): ProductCatalogOption => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  price: Number(row.price),
  stock: row.stock ?? 0,
  isActive: row.isActive ?? true,
  categoryId: row.categoryId ?? null,
  categoryName: row.category?.name ?? row.category?.title ?? null,
  shopName: row.shop?.name ?? null,
  image: row.images?.[0] ?? null,
});

const lifeCyclePath: Record<FlashDealLifecycleAction, string> = {
  publish: "publish",
  activate: "activate",
  pause: "pause",
  cancel: "cancel",
};

export const flashDealAdminApi = {
  getAll: async (
    params: FlashDealListParams = {},
  ): Promise<{
    success: boolean;
    data: FlashDeal[];
    pagination: FlashDealPagination;
  }> => {
    const response: AxiosResponse<ListApiResponse> = await promotionClient.get(
      "/promotions/flash-deals",
      {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          ...(params.status && params.status !== "all"
            ? { status: params.status }
            : {}),
          ...(params.slotTime ? { slotTime: params.slotTime } : {}),
        },
      },
    );
    return {
      success: response.data.success ?? true,
      data: response.data.data ?? [],
      pagination: response.data.pagination ?? {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        total: 0,
        totalPages: 1,
      },
    };
  },

  getById: async (
    id: string,
  ): Promise<{ success: boolean; data: FlashDeal }> => {
    const response: AxiosResponse<SingleApiResponse> =
      await promotionClient.get(`/promotions/flash-deals/${id}`);
    return {
      success: response.data.success ?? true,
      data: response.data.data as FlashDeal,
    };
  },

  create: async (
    payload: CreateFlashDealPayload,
  ): Promise<{ success: boolean; data: FlashDeal }> => {
    const response: AxiosResponse<SingleApiResponse> = await promotionClient.post(
      "/promotions/flash-deals",
      payload,
    );
    return {
      success: response.data.success ?? true,
      data: response.data.data as FlashDeal,
    };
  },

  update: async (
    id: string,
    payload: UpdateFlashDealPayload,
  ): Promise<{ success: boolean; data: FlashDeal }> => {
    const response: AxiosResponse<SingleApiResponse> =
      await promotionClient.patch(`/promotions/flash-deals/${id}`, payload);
    return {
      success: response.data.success ?? true,
      data: response.data.data as FlashDeal,
    };
  },

  delete: async (
    id: string,
  ): Promise<{ success: boolean; message?: string }> => {
    const response: AxiosResponse<MessageApiResponse> =
      await promotionClient.delete(`/promotions/flash-deals/${id}`);
    return {
      success: response.data.success ?? true,
      message: response.data.message,
    };
  },

  lifecycleAction: async (
    id: string,
    action: FlashDealLifecycleAction,
  ): Promise<{ success: boolean; data: FlashDeal }> => {
    const response: AxiosResponse<SingleApiResponse> = await promotionClient.post(
      `/promotions/flash-deals/${id}/${lifeCyclePath[action]}`,
    );
    return {
      success: response.data.success ?? true,
      data: response.data.data as FlashDeal,
    };
  },

  updateStock: async (
    id: string,
    payload: UpdateFlashDealStockPayload,
  ): Promise<{ success: boolean; data: FlashDeal }> => {
    const response: AxiosResponse<SingleApiResponse> =
      await promotionClient.patch(`/promotions/flash-deals/${id}/stock`, payload);
    return {
      success: response.data.success ?? true,
      data: response.data.data as FlashDeal,
    };
  },

  searchProducts: async (query: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    shopId?: string;
  }): Promise<{
    data: ProductCatalogOption[];
    pagination: FlashDealPagination;
  }> => {
    const response: AxiosResponse<ProductsApiResponse> =
      await productClient.get("/products", {
        params: {
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          isActive: query.isActive ?? true,
          ...(query.shopId ? { shopId: query.shopId } : {}),
          ...(query.search ? { search: query.search } : {}),
        },
      });
    const rows = response.data.data ?? [];
    const pagination = response.data.pagination ?? {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      total: 0,
      totalPages: 1,
    };
    return { data: rows.map(toProductOption), pagination };
  },
};