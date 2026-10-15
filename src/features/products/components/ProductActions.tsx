import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "@/app/hooks";
import { addToCart } from "@/features/cart/store/cartSlice";
import { addToCartIcon } from "@/assets/icons";
import type {
  ProductDetail,
  ProductVariant,
} from "@/features/products/types/productTypes";
import { useNavigate } from "react-router-dom";
import {
  pickDefaultVariant,
  variantDisplayLabel,
} from "./ProductVariantSelector";
import { fetchShopProfilesForCurrentCart } from "@/features/shipping/store/shippingThunks";

type ProductActionsProps = {
  product: ProductDetail;
  selectedVariant: ProductVariant | null;
  promoPrice?: number | null;
  flashDealId?: string | null;
  flashDealItemId?: string | null;
  /** Strikethrough price recorded on the cart line when a flash deal applies. */
  originalPrice?: number | null;
};

const ProductActions = ({
  product,
  selectedVariant,
  promoPrice,
  flashDealId,
  flashDealItemId,
  originalPrice,
}: ProductActionsProps) => {
  const dispatch = useAppDispatch();
  const [quantity, setQuantity] = useState(1);

  const navigate = useNavigate();

  const effective = useMemo(
    () => selectedVariant ?? pickDefaultVariant(product.variants),
    [product.variants, selectedVariant],
  );

  const unitPrice = promoPrice != null ? Math.max(0, promoPrice) : effective?.price ?? product.price;
  const originalUnitPrice = originalPrice != null ? originalPrice : effective?.price ?? product.price;
  const maxStock = effective
    ? Math.max(0, Number(effective.shopStock ?? 0)) +
      Math.max(0, Number(effective.warehouseStock ?? 0))
    : Math.max(0, Number(product.stock ?? 0))
  const maxQty = Math.min(99, Math.max(0, maxStock));
  const outOfStock = maxStock <= 0;

  useEffect(() => {
    setQuantity((q) => (maxQty > 0 ? Math.min(q, maxQty) : 1));
  }, [maxQty, product.id]);

  const increase = () =>
    setQuantity((q) => (maxQty > 0 ? Math.min(q + 1, maxQty) : q));
  const decrease = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const cartPayload = () => ({
    productId: product.id,
    variantId: effective?.variantId ?? "",
    variantLabel: effective ? variantDisplayLabel(effective) : undefined,
    name: product.name,
    price: unitPrice,
    ...(promoPrice != null && flashDealId
      ? {
          flashDealId,
          ...(flashDealItemId ? { flashDealItemId } : {}),
          originalPrice: originalUnitPrice,
        }
      : {}),
    image: product.images?.[0],
    quantity,
    weightKg: effective?.weight ?? null,
    lengthCm: effective?.length ?? null,
    widthCm: effective?.width ?? null,
    heightCm: effective?.height ?? null,
    shopId: product.shop.id,
    shopName: product.shop.name,
    categoryId: product.categoryId,
    availableStock: maxStock,
    selected: true,
  });

  const handleAddToCart = () => {
    if (outOfStock) return;
    dispatch(addToCart(cartPayload()));
    void dispatch(fetchShopProfilesForCurrentCart());
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    dispatch(addToCart(cartPayload()));
    void dispatch(fetchShopProfilesForCurrentCart());
    navigate("/cart");
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* QUANTITY */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className="w-20 shrink-0 text-sm font-medium text-gray-900 sm:w-24">Quantity</span>

        <div className="inline-flex items-center overflow-hidden rounded-none border border-gray-200 bg-white">
          <button
            type="button"
            onClick={decrease}
            disabled={quantity === 1 || outOfStock}
            className={`
              flex h-9 w-9 items-center justify-center text-gray-600 transition
              ${quantity === 1 || outOfStock ? "cursor-not-allowed text-gray-300" : "hover:bg-gray-50 cursor-pointer"}
            `}
            aria-label="Decrease"
          >
            <svg viewBox="0 0 10 10" className="w-3 h-3 fill-current">
              <polygon points="0 4.5 10 4.5 10 5.5 0 5.5" />
            </svg>
          </button>

          <input
            type="text"
            value={quantity}
            readOnly
            className="h-9 w-11 border-x border-gray-200 text-center text-sm font-medium outline-none"
          />

          <button
            type="button"
            onClick={increase}
            disabled={outOfStock || quantity >= maxQty}
            className={`flex h-9 w-9 items-center justify-center text-gray-600 transition ${
              outOfStock || quantity >= maxQty
                ? "cursor-not-allowed text-gray-300"
                : "hover:bg-gray-50 cursor-pointer"
            }`}
            aria-label="Increase"
          >
            <svg viewBox="0 0 10 10" className="w-3 h-3 fill-current">
              <polygon points="10 4.5 5.5 4.5 5.5 0 4.5 0 4.5 4.5 0 4.5 0 5.5 4.5 5.5 4.5 10 5.5 10 5.5 5.5 10 5.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="
            flex w-full shrink-0 items-center justify-center gap-2
            h-13 rounded-none px-6
            sm:h-12 sm:w-auto sm:flex-1 sm:rounded-none
            border-2 border-[var(--dni-primary)]
            bg-white
            text-[var(--dni-primary)]
            font-semibold text-sm sm:text-base
            hover:bg-[var(--dni-primary-50)]
            transition cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <img src={addToCartIcon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Add to Cart</span>
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="
            flex w-full shrink-0 items-center justify-center gap-2
            h-13 rounded-none px-6
            sm:h-12 sm:w-auto sm:flex-1 sm:rounded-none
            bg-[var(--dni-primary)]
            text-white
            font-semibold text-sm sm:text-base
            hover:bg-[var(--dni-primary-hover)]
            transition cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <span className="text-base leading-none" aria-hidden>
            ⚡
          </span>
          <span>Buy Now</span>
        </button>
      </div>
    </div>
  );
};

export default ProductActions;
