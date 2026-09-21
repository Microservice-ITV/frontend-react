import { createSlice } from '@reduxjs/toolkit'
import type { AdminPricingRulesState } from '../types/shippingAdminTypes'
import {
  deleteAdminPricingRule,
  fetchAdminPricingRules,
  setAdminPricingRuleStatus,
} from './adminPricingRulesThunks'

const initialState: AdminPricingRulesState = {
  items: [],
  status: 'idle',
  error: null,
  total: 0,
  page: 1,
  pageSize: 20,
  mutationStatus: 'idle',
  mutationError: null,
}

const adminPricingRulesSlice = createSlice({
  name: 'adminPricingRules',
  initialState,
  reducers: {
    resetAdminPricingRules(state) {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminPricingRules.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAdminPricingRules.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.rules
        state.total = action.payload.total
        state.page = action.payload.page
        state.pageSize = action.payload.pageSize
        state.mutationError = null
      })
      .addCase(fetchAdminPricingRules.rejected, (state, action) => {
        state.status = 'failed'
        state.items = []
        state.total = 0
        state.error =
          (action.payload as string) ??
          'Unable to load pricing rules right now. Please try again.'
      })
      .addCase(deleteAdminPricingRule.pending, (state) => {
        state.mutationStatus = 'loading'
        state.mutationError = null
      })
      .addCase(deleteAdminPricingRule.fulfilled, (state) => {
        state.mutationStatus = 'succeeded'
      })
      .addCase(deleteAdminPricingRule.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.mutationError =
          (action.payload as string) ?? 'Could not delete pricing rule. Try again.'
      })
      .addCase(setAdminPricingRuleStatus.pending, (state) => {
        state.mutationStatus = 'loading'
        state.mutationError = null
      })
      .addCase(setAdminPricingRuleStatus.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        const index = state.items.findIndex((rule) => rule.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
      .addCase(setAdminPricingRuleStatus.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.mutationError =
          (action.payload as string) ?? 'Could not update pricing rule status. Try again.'
      })
  },
})

export const { resetAdminPricingRules } = adminPricingRulesSlice.actions
export default adminPricingRulesSlice.reducer
