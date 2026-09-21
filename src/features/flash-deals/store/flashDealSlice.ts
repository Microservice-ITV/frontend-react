import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FlashDeal, FlashDealPagination } from "../types/flashDealTypes";
import {
  fetchFlashDeals,
  fetchFlashDealById,
  createFlashDeal,
  updateFlashDeal,
  deleteFlashDeal,
  runFlashDealLifecycleAction,
  updateFlashDealStock,
} from "./flashDealThunks";

interface FlashDealState {
  items: FlashDeal[];
  selected: FlashDeal | null;
  pagination: FlashDealPagination | null;
  loading: boolean;
  submitting: boolean;
  deleting: boolean;
  actioning: boolean;
  error: string | null;
}

const initialState: FlashDealState = {
  items: [],
  selected: null,
  pagination: null,
  loading: false,
  submitting: false,
  deleting: false,
  actioning: false,
  error: null,
};

const flashDealSlice = createSlice({
  name: "flashDeals",
  initialState,
  reducers: {
    clearFlashDealError: (state) => {
      state.error = null;
    },
    resetFlashDealState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlashDeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchFlashDeals.fulfilled,
        (
          state,
          action: PayloadAction<{
            items: FlashDeal[];
            pagination: FlashDealPagination;
          }>,
        ) => {
          state.loading = false;
          state.items = action.payload.items;
          state.pagination = action.payload.pagination;
        },
      )
      .addCase(fetchFlashDeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load flash deals";
      });

    builder
      .addCase(fetchFlashDealById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selected = null;
      })
      .addCase(fetchFlashDealById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(fetchFlashDealById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load flash deal";
      });

    builder
      .addCase(createFlashDeal.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createFlashDeal.fulfilled, (state, action) => {
        state.submitting = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createFlashDeal.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || "Failed to create flash deal";
      });

    builder
      .addCase(updateFlashDeal.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateFlashDeal.fulfilled, (state, action) => {
        state.submitting = false;
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id,
        );
        if (index !== -1) state.items[index] = action.payload;
        if (state.selected?.id === action.payload.id)
          state.selected = action.payload;
      })
      .addCase(updateFlashDeal.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || "Failed to update flash deal";
      });

    builder
      .addCase(deleteFlashDeal.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteFlashDeal.fulfilled, (state, action) => {
        state.deleting = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
        if (state.selected?.id === action.payload) state.selected = null;
      })
      .addCase(deleteFlashDeal.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Failed to delete flash deal";
      });

    builder
      .addCase(runFlashDealLifecycleAction.pending, (state) => {
        state.actioning = true;
        state.error = null;
      })
      .addCase(runFlashDealLifecycleAction.fulfilled, (state, action) => {
        state.actioning = false;
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id,
        );
        if (index !== -1) state.items[index] = action.payload;
        if (state.selected?.id === action.payload.id)
          state.selected = action.payload;
      })
      .addCase(runFlashDealLifecycleAction.rejected, (state, action) => {
        state.actioning = false;
        state.error = action.payload || "Failed to update flash deal status";
      });

    builder
      .addCase(updateFlashDealStock.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateFlashDealStock.fulfilled, (state, action) => {
        state.submitting = false;
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id,
        );
        if (index !== -1) state.items[index] = action.payload;
        if (state.selected?.id === action.payload.id)
          state.selected = action.payload;
      })
      .addCase(updateFlashDealStock.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || "Failed to update flash deal stock";
      });
  },
});

export const { clearFlashDealError, resetFlashDealState } =
  flashDealSlice.actions;
export default flashDealSlice.reducer;
