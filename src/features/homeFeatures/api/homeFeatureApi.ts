import { productClient } from "@/lib/api/productClient";

import type {
  HomeFeature,
  CreateHomeFeaturePayload,
  UpdateHomeFeaturePayload,
  HomeFeaturesResponse,
  HomeFeatureResponse,
} from "../types/homeFeatureTypes";

import type { AxiosResponse } from "axios";

interface HomeFeaturesApiResponse {
  success?: boolean;
  data?: HomeFeature[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface HomeFeatureApiResponse {
  success?: boolean;
  data?: HomeFeature;
}

const appendPayloadFields = (
  formData: FormData,
  payload: CreateHomeFeaturePayload | UpdateHomeFeaturePayload,
): void => {
  if (payload.name !== undefined) formData.append('name', payload.name)
  if (payload.slug !== undefined) formData.append('slug', payload.slug)
  if (payload.sortOrder !== undefined) formData.append('sortOrder', String(payload.sortOrder))
  if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive))
  if (payload.startAt) formData.append('startAt', payload.startAt)
  if (payload.endAt) formData.append('endAt', payload.endAt)
}

const appendIconFormField = (
  formData: FormData,
  payload: CreateHomeFeaturePayload | UpdateHomeFeaturePayload,
): void => {
  if (payload.iconFile) {
    formData.append('icon', payload.iconFile)
  } else if (payload.existingIconUrl) {
    formData.append('iconUrl', payload.existingIconUrl)
  }
}

export const homeFeatureApi = {
  /**
   * Get all home features
   */
  getAll: async (): Promise<HomeFeaturesResponse> => {
    const response: AxiosResponse<HomeFeaturesApiResponse> =
      await productClient.get("/home-features", {
        params: {
          page: 1,
          limit: 100,
        },
      });

    return {
      success: response.data.success ?? true,
      data: response.data.data ?? [],
      pagination: response.data.pagination ?? {
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0,
      },
    };
  },

  /**
   * Get home feature by ID
   */
  getById: async (id: string): Promise<HomeFeatureResponse> => {
    const response: AxiosResponse<HomeFeatureApiResponse> =
      await productClient.get(`/home-features/${id}`);

    return {
      success: response.data.success ?? true,
      data: response.data.data as HomeFeature,
    };
  },

  /**
   * Get home feature by slug
   */
  getBySlug: async (slug: string): Promise<HomeFeatureResponse> => {
    const response: AxiosResponse<HomeFeatureApiResponse> =
      await productClient.get(`/home-features/slug/${slug}`);

    return {
      success: response.data.success ?? true,
      data: response.data.data as HomeFeature,
    };
  },

  /**
   * Create home feature
   */
  create: async (
    payload: CreateHomeFeaturePayload,
  ): Promise<HomeFeatureResponse> => {
    const formData = new FormData();
    appendPayloadFields(formData, payload);
    appendIconFormField(formData, payload);

    const response: AxiosResponse<HomeFeatureApiResponse> =
      await productClient.post("/home-features", formData);

    return {
      success: response.data.success ?? true,
      data: response.data.data as HomeFeature,
    };
  },

  /**
   * Update home feature
   */
  update: async (
    id: string,
    payload: UpdateHomeFeaturePayload,
  ): Promise<HomeFeatureResponse> => {
    const formData = new FormData();
    appendPayloadFields(formData, payload);
    appendIconFormField(formData, payload);

    const response: AxiosResponse<HomeFeatureApiResponse> =
      await productClient.patch(`/home-features/${id}`, formData);

    return {
      success: response.data.success ?? true,
      data: response.data.data as HomeFeature,
    };
  },

  /**
   * Delete home feature
   */
  delete: async (
    id: string,
  ): Promise<{
    success: boolean;
    message?: string;
  }> => {
    const response = await productClient.delete<{
      success?: boolean;
      message?: string;
    }>(`/home-features/${id}`);

    return {
      success: response.data.success ?? true,
      message: response.data.message,
    };
  },
};
