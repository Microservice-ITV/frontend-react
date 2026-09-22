import { createAsyncThunk } from "@reduxjs/toolkit";
import { flashDealAdminApi } from "../api/flashDealAdminApi";
import type {
  FlashDeal,
  FlashDealListParams,
  FlashDealPagination,
  CreateFlashDealPayload,
  UpdateFlashDealPayload,
  UpdateFlashDealStockPayload,
  FlashDealLifecycleAction,
} from "../types/flashDealTypes";

const normalizeDeal = (deal: FlashDeal): FlashDeal => ({
  ...deal,
  items: deal.items.map((item) => ({
    ...item,
    originalPrice: Number(item.originalPrice),
    dealPrice: Number(item.dealPrice),
    product: {
      ...item.product,
      price: Number(item.product.price),
    },
  })),
});

const extractErrorMessage = (error: unknown): string => {
  const err = error as {
    response?: {
      data?: {
        message?: string;
        error?: { message?: string };
      };
    };
    message?: string;
  };
  return (
    err?.response?.data?.message ??
    err?.response?.data?.error?.message ??
    (error instanceof Error ? error.message : "Unknown error")
  );
};

export const fetchFlashDeals = createAsyncThunk<
  { items: FlashDeal[]; pagination: FlashDealPagination },
  FlashDealListParams,
  { rejectValue: string }
>("flashDeals/fetchFlashDeals", async (params, { rejectWithValue }) => {
  try {
    const response = await flashDealAdminApi.getAll(params);
    return {
      items: (response.data ?? []).map(normalizeDeal),
      pagination: response.pagination,
    };
  } catch (error: unknown) {
    return rejectWithValue(
      extractErrorMessage(error) || "Failed to load flash deals",
    );
  }
});

export const fetchFlashDealById = createAsyncThunk<
  FlashDeal,
  string,
  { rejectValue: string }
>("flashDeals/fetchFlashDealById", async (id, { rejectWithValue }) => {
  try {
    const response = await flashDealAdminApi.getById(id);
    return normalizeDeal(response.data);
  } catch (error: unknown) {
    return rejectWithValue(
      extractErrorMessage(error) || "Failed to load flash deal",
    );
  }
});

export const createFlashDeal = createAsyncThunk<
  FlashDeal,
  CreateFlashDealPayload,
  { rejectValue: string }
>("flashDeals/createFlashDeal", async (payload, { rejectWithValue }) => {
  try {
    const response = await flashDealAdminApi.create(payload);
    return normalizeDeal(response.data);
  } catch (error: unknown) {
    return rejectWithValue(
      extractErrorMessage(error) || "Failed to create flash deal",
    );
  }
});

export const updateFlashDeal = createAsyncThunk<
  FlashDeal,
  { id: string; payload: UpdateFlashDealPayload },
  { rejectValue: string }
>(
  "flashDeals/updateFlashDeal",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await flashDealAdminApi.update(id, payload);
      return normalizeDeal(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        extractErrorMessage(error) || "Failed to update flash deal",
      );
    }
  },
);

export const deleteFlashDeal = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("flashDeals/deleteFlashDeal", async (id, { rejectWithValue }) => {
  try {
    await flashDealAdminApi.delete(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      extractErrorMessage(error) || "Failed to delete flash deal",
    );
  }
});

export const runFlashDealLifecycleAction = createAsyncThunk<
  FlashDeal,
  { id: string; action: FlashDealLifecycleAction },
  { rejectValue: string }
>(
  "flashDeals/runLifecycleAction",
  async ({ id, action }, { rejectWithValue }) => {
    try {
      const response = await flashDealAdminApi.lifecycleAction(id, action);
      return normalizeDeal(response.data);
    } catch (error: unknown) {
      return rejectWithValue(
        extractErrorMessage(error) || "Failed to update flash deal status",
      );
    }
  },
);

export const updateFlashDealStock = createAsyncThunk<
  FlashDeal,
  { id: string; payload: UpdateFlashDealStockPayload },
  { rejectValue: string }
>("flashDeals/updateStock", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const response = await flashDealAdminApi.updateStock(id, payload);
    return normalizeDeal(response.data);
  } catch (error: unknown) {
    return rejectWithValue(
      extractErrorMessage(error) || "Failed to update flash deal stock",
    );
  }
});
