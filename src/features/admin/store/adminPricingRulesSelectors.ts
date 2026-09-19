import type { RootState } from '@/app/store'

export const selectAdminPricingRules = (state: RootState) => state.adminPricingRules.items
export const selectAdminPricingRulesStatus = (state: RootState) => state.adminPricingRules.status
export const selectAdminPricingRulesError = (state: RootState) => state.adminPricingRules.error
export const selectAdminPricingRulesTotal = (state: RootState) => state.adminPricingRules.total
export const selectAdminPricingRulesPage = (state: RootState) => state.adminPricingRules.page
export const selectAdminPricingRulesPageSize = (state: RootState) => state.adminPricingRules.pageSize
export const selectAdminPricingRulesMutationStatus = (state: RootState) =>
  state.adminPricingRules.mutationStatus
export const selectAdminPricingRulesMutationError = (state: RootState) =>
  state.adminPricingRules.mutationError
