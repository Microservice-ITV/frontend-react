import type { RootState } from "@/app/store";

export const selectHomeFeatures = (state: RootState) =>
  state.homeFeatures.items;

export const selectSelectedHomeFeature = (state: RootState) =>
  state.homeFeatures.selected;

export const selectHomeFeaturesLoading = (state: RootState) =>
  state.homeFeatures.loading;

export const selectHomeFeaturesSubmitting = (state: RootState) =>
  state.homeFeatures.submitting;

export const selectHomeFeaturesDeleting = (state: RootState) =>
  state.homeFeatures.deleting;

export const selectHomeFeaturesError = (state: RootState) =>
  state.homeFeatures.error;
