import { useMemo, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { addToCart } from "@/features/cart/store/cartSlice";
import { selectCartItems } from "@/features/cart/store/cartSelectors";
import { toggleWishlist } from "@/features/wishlist/store/wishlistSlice";
// import { toggleWishlist, addToWishlist } from '@/features/wishlist/store/wishlistSlice'
import { selectIsWishlisted } from "@/features/wishlist/store/wishlistSelectors";
import { fetchShopProfilesForCurrentCart } from "@/features/shipping/store/shippingThunks";
import { Product } from "../types/productTypes";
import { formatProductPrice } from "../utils/formatProductPrice";

type BadgeTone = {
  label: string;
  bg: string;
  icon: "star" | "flame" | "spark" | "leaf" | "bolt" | "tag";
};

const BADGE_POOL: BadgeTone[] = [
  { label: "Best Seller", bg: "#f97316", icon: "star" },
  { label: "Hot Deal", bg: "#ef4444", icon: "flame" },
  { label: "Popular", bg: "#3b82f6", icon: "star" },
  { label: "New", bg: "#22c55e", icon: "leaf" },
  { label: "Top Rated", bg: "#ea580c", icon: "star" },
  { label: "Trending", bg: "#f59e0b", icon: "flame" },
  { label: "Smart Choice", bg: "#8b5cf6", icon: "bolt" },
  { label: "Best Value", bg: "#16a34a", icon: "tag" },
  { label: "Outdoor", bg: "#2563eb", icon: "spark" },
  { label: "On Sale", bg: "#ec4899", icon: "tag" },
];

const PLACEHOLDER_SRC =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%" fill="#f5f5f5"/></svg>',
  )

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function formatBadgeLabel(value?: string): string {
  const raw = (value ?? '').trim()
  if (!raw) return ''
  const normalized = raw.replace(/\s+/g, ' ')
  return normalized
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function cardMeta(productId: string) {
  const h = hashId(productId);
  const badge = BADGE_POOL[h % BADGE_POOL.length];
  const rating = 4.5 + ((h >> 3) % 6) / 10; // 4.5–5.0
  const reviews = 8 + (h % 90);
  const sold = 20 + (h % 480);
  return { badge, rating: rating.toFixed(1), reviews, sold };
}

function BadgeIcon({ type }: { type: BadgeTone["icon"] }) {
  const common = "h-3 w-3 shrink-0 fill-current";
  switch (type) {
    case "flame":
      return (
        <svg viewBox="0 0 20 20" className={common} aria-hidden>
          <path d="M10 1.5c.4 2.2-.3 3.7-1.5 5.1C7.2 8 6 9.4 6 11.4c0 2.4 1.8 4.1 4 4.1s4-1.7 4-4.1c0-1.5-.5-2.6-1.3-3.8-.5-.7-1-1.4-1.2-2.4-.2 1.3.2 2.3.9 3.3.3.4.5.8.5 1.3 0 1.5-1.1 2.6-2.9 2.6-1.6 0-2.8-1-2.8-2.6 0-1.3.7-2.3 1.7-3.4C9.4 5.2 10.2 3.8 10 1.5z" />
        </svg>
      );
    case "leaf":
      return (
        <svg viewBox="0 0 20 20" className={common} aria-hidden>
          <path d="M16.5 3.5C10 4 5.5 8.5 4.2 14.2c2.2.9 4.6.6 6.5-1.1 2.2-2 3.7-5.1 4.2-8.4-1.8 2.1-4.3 3.5-7 3.8C10.5 5.8 13.5 4.2 16.5 3.5z" />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 20 20" className={common} aria-hidden>
          <path d="M11 1 4 11h5l-1 8 8-11h-5l1-7z" />
        </svg>
      );
    case "tag":
      return (
        <svg viewBox="0 0 20 20" className={common} aria-hidden>
          <path d="M2 10.5V4a1 1 0 0 1 1-1h6.5a1 1 0 0 1 .7.3l7 7a1 1 0 0 1 0 1.4l-6.5 6.5a1 1 0 0 1-1.4 0l-7-7A1 1 0 0 1 2 10.5zM6.5 7a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 6.5 7z" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 20 20" className={common} aria-hidden>
          <path d="M10 1.5 11.8 7H17l-4.2 3.2L14.5 16 10 12.8 5.5 16l1.7-5.8L3 7h5.2L10 1.5z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" className={common} aria-hidden>
          <path d="M10 1.8 12.3 7l5.5.5-4.2 3.6 1.3 5.3L10 13.8 5.1 16.4l1.3-5.3L2.2 7.5 7.7 7 10 1.8z" />
        </svg>
      );
  }
}

function StarRow({ rating }: { rating: string }) {
  const value = Number(rating);
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = value >= i + 0.75;
        const half = !filled && value >= i + 0.25;
        return (
          <svg key={i} viewBox="0 0 20 20" className="h-3 w-3" aria-hidden>
            <defs>
              {half ? (
                <linearGradient id={`half-${i}-${rating}`} x1="0" x2="1">
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#e5e7eb" />
                </linearGradient>
              ) : null}
            </defs>
            <path
              d="M10 1.8 12.3 7l5.5.5-4.2 3.6 1.3 5.3L10 13.8 5.1 16.4l1.3-5.3L2.2 7.5 7.7 7 10 1.8z"
              fill={
                filled
                  ? "#fbbf24"
                  : half
                    ? `url(#half-${i}-${rating})`
                    : "#e5e7eb"
              }
            />
          </svg>
        );
      })}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  /** @deprecated Kept for callers; card always shows Add to Cart. */
  showFindSimilar?: boolean;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const dispatch = useAppDispatch();
  const wishlisted = useAppSelector((s) => selectIsWishlisted(s, product.id));
  const cartItems = useAppSelector(selectCartItems)
  const [justAdded, setJustAdded] = useState(false)

  const meta = useMemo(() => cardMeta(product.id), [product.id])
  const badgeLabel = useMemo(
    () => formatBadgeLabel(product.tags?.[0] ?? product.text) || meta.badge.label,
    [product.tags, product.text, meta.badge.label],
  )
  const inCart = cartItems.some((item) => item.productId === product.id)
  const showSaveForLater = wishlisted || justAdded || inCart

  const handleWishlist = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlist(product.id));
  };

  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(
      addToCart({
        productId: product.id,
        variantId: "",
        name: product.name,
        price: product.price,
        image: product.images?.[0],
        quantity: 1,
        shopId: "unknown",
        shopName: "Seller store",
        selected: true,
      }),
    );
    void dispatch(fetchShopProfilesForCurrentCart());
    // setJustAdded(true)
  };

  /*
  const handleSaveForLater = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(addToWishlist(product.id))
  }
  */

  return (
    <article
      className="
        group relative flex h-full flex-col overflow-hidden
        border border-[var(--dni-cart-border)] bg-white
        transition-[border-color,background-color] duration-150
        hover:border-[var(--dni-primary)]
        hover:bg-[var(--dni-primary-soft)]
      "
    >
      <Link
        to={`/products/${product.id}`}
        className="flex min-h-0 flex-1 flex-col"
      >
        {/* IMAGE */}
        <div className="relative w-full shrink-0 bg-[#fafafa] pt-[100%]">
          <img
            src={`${product.images?.[0] ?? "/placeholder.svg"}`}
            alt={product.name}
            className="pointer-events-none absolute inset-0 h-full w-full object-fill p-2"
            loading="lazy"
          />

          {/* Status badge */}
          <span
            className="absolute left-0 top-2 z-[1] inline-flex max-w-[75%] items-center gap-1 px-2 py-1 text-[10px] font-semibold leading-none text-white"
            style={{ backgroundColor: meta.badge.bg }}
          >
            <BadgeIcon type={meta.badge.icon} />
            <span className="truncate">{badgeLabel}</span>
          </span>

          {/* Wishlist */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="
                absolute right-2 top-2 z-[1] flex h-8 w-8 items-center justify-center
                border border-black/10 bg-white text-gray-500
                transition-colors duration-300
                hover:border-[var(--dni-primary)] hover:text-[var(--dni-primary)]
              "
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className={`h-4 w-4 origin-center transition-all duration-300 ease-out
                  ${
                    wishlisted
                      ? "fill-[#ef4444] text-[#ef4444] scale-110 animate-heart-pop"
                      : "fill-none stroke-current scale-100"
                  }
                `}
              strokeWidth={wishlisted ? 0 : 1.8}
              aria-hidden
            >
              <path d="M12 21s-6.5-4.35-9.2-8.1C1.1 10.5 1.4 7.4 3.7 5.7c2-1.5 4.7-1.1 6.2.7L12 8.3l2.1-1.9c1.5-1.8 4.2-2.2 6.2-.7 2.3 1.7 2.6 4.8.9 7.2C18.5 16.65 12 21 12 21z" />
            </svg>
          </button>
        </div>

        {/* META */}
        <div className="flex flex-1 flex-col gap-1.5 px-3 pb-2 pt-2.5">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-slate-800">
            {product.name}
          </h3>

          <p className="text-base font-bold leading-none tracking-tight text-[var(--dni-primary)]">
            {formatProductPrice(product.price)}
          </p>

          <div className="mt-auto flex items-center justify-between gap-2 pt-0.5">
            <div className="flex min-w-0 items-center gap-1">
              <StarRow rating={meta.rating} />
              <span className="truncate text-[11px] font-medium text-slate-600">
                {meta.rating}{" "}
                <span className="font-normal text-slate-400">
                  ({meta.reviews})
                </span>
              </span>
            </div>
            <span className="shrink-0 text-[11px] text-slate-400">
              {meta.sold} sold
            </span>
          </div>
        </div>
      </Link>

      {/* CTA — always visible, flush to card bottom */}
      {/*
      {showSaveForLater ? (
        <button
          type="button"
          onClick={handleSaveForLater}
          className="
            mt-1 flex h-10 w-full items-center justify-center gap-1.5
            rounded-none border-t border-[var(--dni-primary)]/30
            bg-[var(--dni-primary-soft)] text-sm font-semibold text-[var(--dni-primary)]
            transition-colors hover:bg-[var(--dni-primary-100)]
          "
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
          </svg>
          Save for Later
        </button>
      ) : (
        */}
      <button
        type="button"
        onClick={handleAddToCart}
        className="
          mt-1 flex h-10 w-full items-center justify-center gap-1.5
          bg-[var(--dni-primary)] text-sm font-semibold text-white
          transition-[background-color,transform] hover:bg-[var(--dni-primary-hover)]
          active:scale-[0.99]
        "
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M7 4h-2l-1 2v1h2l3.6 7.6-1.4 2.4A1 1 0 0 0 9 19h11v-2H9.4l.9-1.5h6.9a1 1 0 0 0 .9-.55L22 8H8.2l-.6-1.3L6.8 4H7zm2 16a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
        </svg>
        Add to Cart
      </button>
      {/*
      )}
      */}
    </article>
  );
};

export default ProductCard;