import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";

export const selectWishlistItems = (state: RootState) =>
  state.wishlist.items ?? [];

export const selectWishlistCount = createSelector(
  selectWishlistItems,
  (items) => items.length,
);

export const selectWishlistProductIds = createSelector(
  selectWishlistItems,
  (items) => items.map((i) => i.productId),
);

export const selectWishlistProductIdSet = createSelector(
  selectWishlistItems,
  (items) => new Set(items.map((i) => i.productId)),
);

/** True when `productId` is currently in the wishlist (used by cards/icons). */
export const selectIsWishlisted = (
  state: RootState,
  productId?: string | null,
): boolean => {
  if (!productId) return false;
  return selectWishlistProductIdSet(state).has(productId);
};
