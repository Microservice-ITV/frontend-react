import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  adminShippingApi,
  type DistanceRangeListData,
  type ListDistanceRangesParams,
} from '../api/adminShippingApi'

export const fetchAdminDistanceRanges = createAsyncThunk<
  DistanceRangeListData,
  ListDistanceRangesParams,
  { rejectValue: string }
>('adminDistanceRanges/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await adminShippingApi.listDistanceRanges(params)
    return response.data.data
  } catch (error: unknown) {
    return rejectWithValue(
      adminShippingApi.getApiErrorMessage(
        error,
        'Unable to load distance ranges right now. Please try again.',
      ),
    )
  }
})

export const deleteAdminDistanceRange = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('adminDistanceRanges/delete', async (id, { rejectWithValue }) => {
  try {
    await adminShippingApi.deleteDistanceRange(id)
    return id
  } catch (error: unknown) {
    return rejectWithValue(
      adminShippingApi.getApiErrorMessage(error, 'Could not delete distance range. Try again.'),
    )
  }
})
