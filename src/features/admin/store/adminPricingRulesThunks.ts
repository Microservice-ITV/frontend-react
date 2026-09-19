import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  adminShippingApi,
  type DeliveryPricingRuleDto,
  type PricingRuleListData,
  type PricingRuleStatus,
  type ListPricingRulesParams,
} from '../api/adminShippingApi'

export const fetchAdminPricingRules = createAsyncThunk<
  PricingRuleListData,
  ListPricingRulesParams,
  { rejectValue: string }
>('adminPricingRules/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await adminShippingApi.listPricingRules(params)
    return response.data.data
  } catch (error: unknown) {
    return rejectWithValue(
      adminShippingApi.getApiErrorMessage(
        error,
        'Unable to load pricing rules right now. Please try again.',
      ),
    )
  }
})

export const deleteAdminPricingRule = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('adminPricingRules/delete', async (id, { rejectWithValue }) => {
  try {
    await adminShippingApi.deletePricingRule(id)
    return id
  } catch (error: unknown) {
    return rejectWithValue(
      adminShippingApi.getApiErrorMessage(error, 'Could not delete pricing rule. Try again.'),
    )
  }
})

export const setAdminPricingRuleStatus = createAsyncThunk<
  DeliveryPricingRuleDto,
  { id: string; status: PricingRuleStatus },
  { rejectValue: string }
>('adminPricingRules/setStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const response = await adminShippingApi.updatePricingRule(id, { status })
    return response.data.data
  } catch (error: unknown) {
    return rejectWithValue(
      adminShippingApi.getApiErrorMessage(error, 'Could not update pricing rule status. Try again.'),
    )
  }
})
