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
  product: ProductDetail
  selectedVariant: ProductVariant | null
  /** Present when this product is bought from a flash deal slot; carried to checkout for deal stock reservation. */
  flashDealItemId?: string
}


const ProductActions = ({ product, selectedVariant, flashDealItemId }: ProductActionsProps) => {
  const dispatch = useAppDispatch();
  const [quantity, setQuantity] = useState(1);
  product: ProductDetail;
  selectedVariant: ProductVariant | null;
  const navigate = useNavigate();

  const effective = useMemo(
    () => selectedVariant ?? pickDefaultVariant(product.variants),
    [product.variants, selectedVariant],
  );

  const unitPrice = effective?.price ?? product.price;
  const maxStock = effective ? effective.shopStock : (product.stock ?? 0);
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
    image: product.images?.[0],
    quantity,
    shopId: product.shop.id,
    shopName: product.shop.name,
    selected: true,
    ...(flashDealItemId ? { flashDealItemId } : {}),
  })
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
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="text-sm font-medium text-gray-700">Quantity</span>

        <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
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
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="
            flex flex-1 items-center justify-center gap-2
            h-11 sm:h-12 px-6
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
            flex flex-1 items-center justify-center gap-2
            h-11 sm:h-12 px-6
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
