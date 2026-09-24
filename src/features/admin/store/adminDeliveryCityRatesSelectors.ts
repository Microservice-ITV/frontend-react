import type { RootState } from "@/app/store";

export const selectAdminDeliveryCityRates = (state: RootState) =>
  state.adminDeliveryCityRates.items;

export const selectAdminDeliveryCityRatesStatus = (state: RootState) =>
  state.adminDeliveryCityRates.status;

export const selectAdminDeliveryCityRatesError = (state: RootState) =>
  state.adminDeliveryCityRates.error;

export const selectAdminDeliveryCityRatesTotal = (state: RootState) =>
  state.adminDeliveryCityRates.total;

export const selectAdminDeliveryCityRatesPage = (state: RootState) =>
  state.adminDeliveryCityRates.page;

export const selectAdminDeliveryCityRatesPageSize = (state: RootState) =>
  state.adminDeliveryCityRates.pageSize;

export const selectAdminDeliveryCityRatesMutationStatus = (state: RootState) =>
  state.adminDeliveryCityRates.mutationStatus;

export const selectAdminDeliveryCityRatesMutationError = (state: RootState) =>
  state.adminDeliveryCityRates.mutationError;
