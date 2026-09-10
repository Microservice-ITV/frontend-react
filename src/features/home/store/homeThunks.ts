import { createAsyncThunk } from '@reduxjs/toolkit'
import { productServiceAssetUrl } from '@/lib/api/apiConfig'
import { homeApi } from '../api/homeApi'
import type { HomeFeature } from './homeTypes'

export const fetchHomeQuickActions = createAsyncThunk<
  HomeFeature[],
  void,
  { rejectValue: string }
>('homeQuickActions/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await homeApi.getQuickActions()
    const list = response.data?.data ?? []
    return list.map((feature) => ({
      ...feature,
      iconUrl: productServiceAssetUrl(feature.iconUrl),
    }))
  } catch (error: any) {
    const message =
      error?.response?.data?.message || error.message || 'Failed to load home features'
    return rejectWithValue(message)
  }
})