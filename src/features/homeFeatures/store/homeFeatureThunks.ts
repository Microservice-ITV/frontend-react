import { createAsyncThunk } from "@reduxjs/toolkit";
import { productServiceAssetUrl } from "@/lib/api/apiConfig";
import { homeFeatureApi } from "../api/homeFeatureApi";
import type {
  HomeFeature,
  CreateHomeFeaturePayload,
  UpdateHomeFeaturePayload,
} from "../types/homeFeatureTypes";

const toViewModel = (feature: HomeFeature): HomeFeature => ({
  ...feature,
  iconUrl: feature.iconUrl
    ? productServiceAssetUrl(feature.iconUrl)
    : feature.iconUrl,
});

/* ------------------------------
   GET ALL
--------------------------------- */
export const fetchHomeFeatures = createAsyncThunk<
  HomeFeature[],
  void,
  { rejectValue: string }
>("homeFeatures/fetchHomeFeatures", async (_, { rejectWithValue }) => {
  try {
    const response = await homeFeatureApi.getAll();
    return (response.data ?? []).map(toViewModel);
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ??
      (error instanceof Error ? error.message : "Failed to load home features");
    return rejectWithValue(message);
  }
});

/* ------------------------------
   GET BY ID
--------------------------------- */
export const fetchHomeFeatureById = createAsyncThunk<
  HomeFeature,
  string,
  { rejectValue: string }
>("homeFeatures/fetchHomeFeatureById", async (id, { rejectWithValue }) => {
  try {
    const response = await homeFeatureApi.getById(id);
    return toViewModel(response.data);
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ??
      (error instanceof Error ? error.message : "Failed to load home feature");
    return rejectWithValue(message);
  }
});

/* ------------------------------
   CREATE
--------------------------------- */
export const createHomeFeature = createAsyncThunk<
  HomeFeature,
  CreateHomeFeaturePayload,
  { rejectValue: string }
>("homeFeatures/createHomeFeature", async (payload, { rejectWithValue }) => {
  try {
    const response = await homeFeatureApi.create(payload);
    return toViewModel(response.data);
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ??
      (error instanceof Error
        ? error.message
        : "Failed to create home feature");
    return rejectWithValue(message);
  }
});

/* ------------------------------
   UPDATE
--------------------------------- */
export const updateHomeFeature = createAsyncThunk<
  HomeFeature,
  { id: string; payload: UpdateHomeFeaturePayload },
  { rejectValue: string }
>("homeFeatures/updateHomeFeature", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const response = await homeFeatureApi.update(id, payload);
    return toViewModel(response.data);
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ??
      (error instanceof Error
        ? error.message
        : "Failed to update home feature");
    return rejectWithValue(message);
  }
});

/* ------------------------------
   DELETE
--------------------------------- */
export const deleteHomeFeature = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("homeFeatures/deleteHomeFeature", async (id, { rejectWithValue }) => {
  try {
    await homeFeatureApi.delete(id);
    return id;
  } catch (error: unknown) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ??
      (error instanceof Error
        ? error.message
        : "Failed to delete home feature");
    return rejectWithValue(message);
  }
});