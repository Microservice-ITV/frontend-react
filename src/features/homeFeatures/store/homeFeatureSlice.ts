import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { HomeFeature } from "../types/homeFeatureTypes";

import {
  fetchHomeFeatures,
  fetchHomeFeatureById,
  createHomeFeature,
  updateHomeFeature,
  deleteHomeFeature,
} from "./homeFeatureThunks";

interface HomeFeatureState {
  items: HomeFeature[];
  selected: HomeFeature | null;

  loading: boolean;
  submitting: boolean;
  deleting: boolean;

  error: string | null;
}

const initialState: HomeFeatureState = {
  items: [],
  selected: null,

  loading: false,
  submitting: false,
  deleting: false,

  error: null,
};

const homeFeatureSlice = createSlice({
  name: "homeFeatures",

  initialState,

  reducers: {
    setHomeFeatures: (state, action: PayloadAction<HomeFeature[]>) => {
      state.items = action.payload;
    },

    setSelectedHomeFeature: (
      state,
      action: PayloadAction<HomeFeature | null>,
    ) => {
      state.selected = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    resetHomeFeatureState: () => initialState,
  },

  extraReducers: (builder) => {
    // ============================================
    // GET ALL
    // ============================================

    builder
      .addCase(fetchHomeFeatures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchHomeFeatures.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })

      .addCase(fetchHomeFeatures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load home features";
      });

    // ============================================
    // GET BY ID
    // ============================================

    builder
      .addCase(fetchHomeFeatureById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selected = null;
      })

      .addCase(fetchHomeFeatureById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })

      .addCase(fetchHomeFeatureById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load home feature";
      });

    // ============================================
    // CREATE
    // ============================================

    builder
      .addCase(createHomeFeature.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })

      .addCase(createHomeFeature.fulfilled, (state, action) => {
        state.submitting = false;

        state.items.push(action.payload);

        state.items.sort((a, b) => a.sortOrder - b.sortOrder);
      })

      .addCase(createHomeFeature.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || "Failed to create home feature";
      });

    // ============================================
    // UPDATE
    // ============================================

    builder
      .addCase(updateHomeFeature.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })

      .addCase(updateHomeFeature.fulfilled, (state, action) => {
        state.submitting = false;

        const index = state.items.findIndex(
          (item) => item.id === action.payload.id,
        );

        if (index !== -1) {
          state.items[index] = action.payload;
        }

        state.items.sort((a, b) => a.sortOrder - b.sortOrder);

        if (state.selected?.id === action.payload.id) {
          state.selected = action.payload;
        }
      })

      .addCase(updateHomeFeature.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || "Failed to update home feature";
      });

    // ============================================
    // DELETE
    // ============================================

    builder
      .addCase(deleteHomeFeature.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })

      .addCase(deleteHomeFeature.fulfilled, (state, action) => {
        state.deleting = false;

        state.items = state.items.filter((item) => item.id !== action.payload);

        if (state.selected?.id === action.payload) {
          state.selected = null;
        }
      })

      .addCase(deleteHomeFeature.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload || "Failed to delete home feature";
      });
  },
});

export const {
  setHomeFeatures,
  setSelectedHomeFeature,
  clearError,
  resetHomeFeatureState,
} = homeFeatureSlice.actions;

export default homeFeatureSlice.reducer;
