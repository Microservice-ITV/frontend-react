import type { AppDispatch } from "@/app/store";
import { store } from "@/app/store";
import { syncWishlist } from "@/features/wishlist/store/wishlistSlice";
import {
  loadAnonWishlist,
  loadUserWishlist,
} from "@/features/wishlist/utils/wishlistStorage";
import { hasSessionCookie } from "@/utils/session";
import {
  restoreGuestWishlist,
  syncWishlistWithServer,
} from "@/features/wishlist/store/wishlistThunks";

let initialized = false;
let serverSyncInitialized = false;

const loadLocalWishlist = () => {
  const sessionExists = hasSessionCookie();
  const user = sessionExists ? [] : loadUserWishlist();
  const anon = loadAnonWishlist();

  return user.length > 0 ? user : anon;
};

export const initWishlistSync = (dispatch: AppDispatch) => {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  dispatch(syncWishlist(loadLocalWishlist()));

  window.addEventListener("storage", (event) => {
    if (event.key !== "dni_wishlist_anon" && event.key !== "dni_wishlist") {
      return;
    }

    dispatch(syncWishlist(loadLocalWishlist()));
  });
};

/**
 * Keeps the authenticated wishlist aligned with the database and restores the
 * guest wishlist after logout or session expiry.
 */
export const initWishlistServerSync = (dispatch: AppDispatch) => {
  if (typeof window === "undefined" || serverSyncInitialized) return;
  serverSyncInitialized = true;

  let previousUserId: string | null = null;
  let previousInitialized = false;

  store.subscribe(() => {
    const auth = store.getState().auth;
    const userId = auth.user?.id ?? null;
    const authInitialized = auth.initialized;

    const transitionToSignedIn =
      Boolean(userId) &&
      authInitialized &&
      (userId !== previousUserId || !previousInitialized);

    if (transitionToSignedIn) {
      const mergeGuest = Boolean(
        previousUserId === null && previousInitialized,
      );
      previousUserId = userId;
      previousInitialized = authInitialized;
      void dispatch(syncWishlistWithServer({ mergeGuest }));
      return;
    }

    if (!userId && previousUserId) {
      previousUserId = null;
      previousInitialized = authInitialized;
      void dispatch(restoreGuestWishlist());
      return;
    }

    previousUserId = userId;
    previousInitialized = authInitialized;
  });
};
