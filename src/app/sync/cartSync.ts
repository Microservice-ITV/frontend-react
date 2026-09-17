import type { AppDispatch } from "@/app/store";
import { syncCart } from "@/features/cart/store/cartSlice";
import { loadCart } from "@/features/cart/utils/cartStorage";

let initialized = false;

export const initCartSync = (dispatch: AppDispatch) => {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  const cart = loadCart();
  if (cart) {
    dispatch(syncCart(cart));
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== "dni_cart") return;

    const cart = loadCart();
    if (cart) {
      dispatch(syncCart(cart));
    }
  });
};
