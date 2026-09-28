import { createAsyncThunk } from "@reduxjs/toolkit";
import { shopApi } from "../api/shopApi";
import type { Shop, ShopSearchPagination } from "../types/shopTypes";

export const searchShops = createAsyncThunk<
  { shops: Shop[]; pagination: ShopSearchPagination },
  { query: string; page?: number; perPage?: number },
  { rejectValue: string }
>("shops/search", async ({ query, page, perPage }, { rejectWithValue }) => {
  try {
    const result = await shopApi.searchPublic({
      search: query,
      page,
      perPage,
    });
    return {
      shops: result.shops,
      pagination: result.pagination,
    };
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? (error instanceof Error ? error.message : "Shop search failed");
    return rejectWithValue(message);
  }
});

