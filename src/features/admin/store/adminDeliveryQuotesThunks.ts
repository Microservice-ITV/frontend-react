import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  adminShippingApi,
  type DeliveryQuoteDto,
  type DeliveryQuoteListData,
  type ListDeliveryQuotesParams,
} from '../api/adminShippingApi'

export const fetchAdminDeliveryQuotes = createAsyncThunk<
  DeliveryQuoteListData,
  ListDeliveryQuotesParams,
  { rejectValue: string }
>('adminDeliveryQuotes/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await adminShippingApi.listDeliveryQuotes(params)
    return response.data.data
  } catch (error: unknown) {
    return rejectWithValue(
      adminShippingApi.getApiErrorMessage(
        error,
        'Unable to load delivery quotes right now. Please try again.',
      ),
    )
  }
})

export const cancelAdminDeliveryQuote = createAsyncThunk<
  DeliveryQuoteDto,
  string,
  { rejectValue: string }
>('adminDeliveryQuotes/cancel', async (id, { rejectWithValue }) => {
  try {
    const response = await adminShippingApi.cancelDeliveryQuote(id)
    return response.data.data
  } catch (error: unknown) {
    return rejectWithValue(
      adminShippingApi.getApiErrorMessage(error, 'Could not cancel delivery quote. Try again.'),
    )
  }
})
