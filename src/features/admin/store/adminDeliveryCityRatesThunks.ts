import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  adminShippingApi,
  type DeliveryCityRateListData,
  type ListDeliveryCityRatesParams,
} from "../api/adminShippingApi";

export const fetchAdminDeliveryCityRates = createAsyncThunk<
  DeliveryCityRateListData,
  ListDeliveryCityRatesParams,
  { rejectValue: string }
>("adminDeliveryCityRates/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const response = await adminShippingApi.listDeliveryCityRates(params);
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(
      adminShippingApi.getApiErrorMessage(
        error,
        "Unable to load delivery city rates right now. Please try again.",
      ),
    );
  }
});

export const deleteAdminDeliveryCityRate = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("adminDeliveryCityRates/delete", async (id, { rejectWithValue }) => {
  try {
    await adminShippingApi.deleteDeliveryCityRate(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      adminShippingApi.getApiErrorMessage(
        error,
        "Could not delete delivery city rate. Try again.",
      ),
    );
  }
});
