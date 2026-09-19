import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";

export const selectCategories = (state: RootState) => state.categories.items;
export const selectCategoriesStatus = (state: RootState) =>
  state.categories.status;
export const selectCategoriesWithProducts = createSelector(
  [selectCategories],
  (items) => items.filter((c) => (c._count?.products ?? 0) > 0),
);
