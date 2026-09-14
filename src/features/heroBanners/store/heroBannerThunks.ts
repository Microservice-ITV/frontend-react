import { createAsyncThunk } from '@reduxjs/toolkit'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { heroBannerApi } from '../api/heroBannerApi'
import type {
  HeroBanner,
  CreateHeroBannerPayload,
  UpdateHeroBannerPayload,
} from '../types/heroBannerTypes'

const toViewModel = (banner: HeroBanner): HeroBanner => ({
  ...banner,
  imageUrl: banner.imageUrl ? productServiceAssetUrl(banner.imageUrl) : banner.imageUrl,
})

export const fetchHeroBanners = createAsyncThunk<HeroBanner[], void, { rejectValue: string }>(
  'heroBanners/fetchHeroBanners', async (_, { rejectWithValue }) => {
    try {
      const response = await heroBannerApi.getAll()
      return (response.data ?? []).map(toViewModel)
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (error instanceof Error ? error.message : 'Failed to load hero banners')
      return rejectWithValue(message)
    }
  }
)

export const fetchHeroBannerById = createAsyncThunk<HeroBanner, string, { rejectValue: string }>(
  'heroBanners/fetchHeroBannerById', async (id, { rejectWithValue }) => {
    try {
      const response = await heroBannerApi.getById(id)
      return toViewModel(response.data)
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (error instanceof Error ? error.message : 'Failed to load hero banner')
      return rejectWithValue(message)
    }
  }
)

export const createHeroBanner = createAsyncThunk<HeroBanner, CreateHeroBannerPayload, { rejectValue: string }>(
  'heroBanners/createHeroBanner', async (payload, { rejectWithValue }) => {
    try {
      const response = await heroBannerApi.create(payload)
      return toViewModel(response.data)
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (error instanceof Error ? error.message : 'Failed to create hero banner')
      return rejectWithValue(message)
    }
  }
)

export const updateHeroBanner = createAsyncThunk<HeroBanner, { id: string; payload: UpdateHeroBannerPayload }, { rejectValue: string }>(
  'heroBanners/updateHeroBanner', async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await heroBannerApi.update(id, payload)
      return toViewModel(response.data)
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (error instanceof Error ? error.message : 'Failed to update hero banner')
      return rejectWithValue(message)
    }
  }
)

export const deleteHeroBanner = createAsyncThunk<string, string, { rejectValue: string }>(
  'heroBanners/deleteHeroBanner', async (id, { rejectWithValue }) => {
    try {
      await heroBannerApi.delete(id)
      return id
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (error instanceof Error ? error.message : 'Failed to delete hero banner')
      return rejectWithValue(message)
    }
  }
)
