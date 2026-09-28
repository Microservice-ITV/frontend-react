import { createSlice } from "@reduxjs/toolkit";
import type { ShopsState } from "../types/shopTypes";
import { searchShops } from "./shopThunks";

const initialState: ShopsState = {
  searchResults: [],
  searchStatus: "idle",
  searchError: null,
  searchPagination: null,
};

const shopSlice = createSlice({
  name: "shops",
  initialState,
  reducers: {
    clearShopSearch(state) {
      state.searchResults = [];
      state.searchStatus = "idle";
      state.searchError = null;
      state.searchPagination = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchShops.pending, (state) => {
        state.searchStatus = "loading";
        state.searchError = null;
      })
      .addCase(searchShops.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
        state.searchResults = action.payload.shops;
        state.searchPagination = action.payload.pagination;
      })
      .addCase(searchShops.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.searchError = (action.payload as string) ?? "Shop search failed";
        state.searchResults = [];
        state.searchPagination = null;
      });
  },
});

export const { clearShopSearch } = shopSlice.actions;
export default shopSlice.reducer;

