import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  adminShippingApi,
  type ListWeightRatesParams,
  type WeightRateListData,
} from '../api/adminShippingApi'

export const fetchAdminWeightRates = createAsyncThunk<
  WeightRateListData,
  ListWeightRatesParams,
  { rejectValue: string }
>('adminWeightRates/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await adminShippingApi.listWeightRates(params)
    return response.data.data
  } catch (error: unknown) {
    return rejectWithValue(
      adminShippingApi.getApiErrorMessage(
        error,
        'Unable to load weight rates right now. Please try again.',
      ),
    )
  }
})

export const deleteAdminWeightRate = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('adminWeightRates/delete', async (id, { rejectWithValue }) => {
  try {
    await adminShippingApi.deleteWeightRate(id)
    return id
  } catch (error: unknown) {
    return rejectWithValue(
      adminShippingApi.getApiErrorMessage(error, 'Could not delete weight rate. Try again.'),
    )
  }
})
