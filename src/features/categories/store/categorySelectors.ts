import type { RootState } from "@/app/store";

export const selectCategories = (state: RootState) => state.categories.items;
export const selectCategoriesStatus = (state: RootState) =>
  state.categories.status;
