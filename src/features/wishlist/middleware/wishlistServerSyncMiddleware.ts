import type { Middleware } from "@reduxjs/toolkit";
import { wishlistServerApi } from "../api/wishlistServerApi";

// Only these slice reducers represent a real user intent to change the wishlist.
// Hydration (`syncWishlist`) and auth bootstrap must NOT push.
const MUTATION_ACTION_TYPES = new Set([
  "wishlist/toggleWishlist",
  "wishlist/addToWishlist",
  "wishlist/removeFromWishlist",
  "wishlist/clearWishlist",
]);

/**
 * Best-effort server sync using item-level endpoints. Replacing the entire
 * server list after every toggle can delete valid rows when the browser state
 * is still hydrating after a refresh.
 */
export const wishlistServerSyncMiddleware: Middleware =
  (store) => (next) => (action) => {
    // Let reducers process the action first
    const result = next(action);

    const state = store.getState() as {
      auth: { user?: { id?: string } | null };
      wishlist: { items: { productId: string }[] };
    };

    const userId = state.auth.user?.id;

    if (!userId) {
      return result;
    }

    if (!MUTATION_ACTION_TYPES.has(action.type)) {
      return result;
    }

    const productId = typeof action.payload === "string" ? action.payload : "";
    const isPresent =
      productId.length > 0 &&
      state.wishlist.items.some((item) => item.productId === productId);

    let request: Promise<unknown>;
    if (action.type === "wishlist/clearWishlist") {
      request = wishlistServerApi.clear();
    } else if (action.type === "wishlist/removeFromWishlist" || !isPresent) {
      request = productId
        ? wishlistServerApi.remove(productId)
        : Promise.resolve();
    } else {
      request = wishlistServerApi.add(productId);
    }

    void request.catch(() => {
      // Best-effort; the next user mutation or refresh will reconcile.
    });

    return result;
  };
