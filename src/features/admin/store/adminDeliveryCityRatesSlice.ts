import { createSlice } from "@reduxjs/toolkit";
import type { AdminDeliveryCityRateDto } from "../api/adminShippingApi";
import {
  deleteAdminDeliveryCityRate,
  fetchAdminDeliveryCityRates,
} from "./adminDeliveryCityRatesThunks";
import adminDeliveryCityRatesReducer from "@/features/admin/store/adminDeliveryCityRatesSlice";

type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

type AdminDeliveryCityRatesState = {
  items: AdminDeliveryCityRateDto[];
  status: RequestStatus;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  mutationStatus: RequestStatus;
  mutationError: string | null;
};

const initialState: AdminDeliveryCityRatesState = {
  items: [],
  status: "idle",
  error: null,
  total: 0,
  page: 1,
  pageSize: 10,
  mutationStatus: "idle",
  mutationError: null,
};

const adminDeliveryCityRatesSlice = createSlice({
  name: "adminDeliveryCityRates",
  initialState,
  reducers: {
    clearAdminDeliveryCityRatesError(state) {
      state.error = null;
    },
    resetAdminDeliveryCityRates() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDeliveryCityRates.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAdminDeliveryCityRates.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.cityRates;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
        state.mutationError = null;
      })
      .addCase(fetchAdminDeliveryCityRates.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to load delivery city rates.";
      })
      .addCase(deleteAdminDeliveryCityRate.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(deleteAdminDeliveryCityRate.fulfilled, (state) => {
        state.mutationStatus = "succeeded";
      })
      .addCase(deleteAdminDeliveryCityRate.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError =
          action.payload ?? "Could not delete delivery city rate. Try again.";
      });
  },
});

export const { clearAdminDeliveryCityRatesError, resetAdminDeliveryCityRates } =
  adminDeliveryCityRatesSlice.actions;

export default adminDeliveryCityRatesSlice.reducer;
