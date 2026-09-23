import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import type { WishlistItem } from "../types/wishlistTypes";
import { syncWishlist } from "./wishlistSlice";
import { loadAnonWishlist, saveAnonWishlist } from "../utils/wishlistStorage";
import { wishlistServerApi } from "../api/wishlistServerApi";

const toItems = (productIds: string[]): WishlistItem[] =>
  [...new Set(productIds.filter(Boolean))].map((productId) => ({ productId }));

export const syncWishlistWithServer = createAsyncThunk<
  WishlistItem[],
  { mergeGuest?: boolean } | undefined,
  { state: RootState; rejectValue: string }
>(
  "wishlist/syncWithServer",
  async (args, { getState, dispatch, rejectWithValue }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return getState().wishlist.items;

    const mergeGuest = Boolean(args?.mergeGuest);

    try {
      const server = await wishlistServerApi.listAll();
      const serverIds = server.map((i) => i.productId);
      const anonIds = mergeGuest
        ? loadAnonWishlist().map((i) => i.productId)
        : [];
      // On a page refresh the database is authoritative. Only merge the
      // current UI/guest state during an intentional in-app login merge.
      const localIds = mergeGuest
        ? getState().wishlist.items.map((i) => i.productId)
        : [];
      const merged = toItems([...serverIds, ...localIds, ...anonIds]);

      dispatch(syncWishlist(merged));

      const mergedIds = merged.map((i) => i.productId);
      const mergedSignature = mergedIds.slice().sort().join(",");
      const serverSignature = serverIds.slice().sort().join(",");
      if (mergedSignature !== serverSignature) {
        await wishlistServerApi.writeAll(mergedIds);
      }

      if (mergeGuest) {
        saveAnonWishlist([]);
      }

      return merged;
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to sync wishlist",
      );
    }
  },
);

export const restoreGuestWishlist = createAsyncThunk<
  WishlistItem[],
  void,
  { state: RootState }
>("wishlist/restoreGuest", async (_, { dispatch }) => {
  const guest = loadAnonWishlist();
  dispatch(syncWishlist(guest));
  return guest;
});
