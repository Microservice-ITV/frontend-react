import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Flame, ImageOff } from "lucide-react";
import { productServiceAssetUrl } from "@/lib/api/apiConfig";
import { formatProductPrice } from "@/features/products/utils/formatProductPrice";

interface FlashDeal {
  id: number | string;
  productId: string;
  flashDealId: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  discount: number;
  stockText: string;
  soldPercent: number;
  soldOut?: boolean;
  startAt?: string;
  endAt?: string;
  cta?: "buy-now" | "remind-me";
}

const renderDealHref = (deal: FlashDeal) => ({
  pathname: `/products/${deal.productId}`,
  state: {
    flashDealPromo: {
      flashDealId: deal.flashDealId,
      originalPrice: deal.originalPrice,
      promoPrice: deal.price,
      discount: deal.discount,
      startAt: deal.startAt ?? null,
      endAt: deal.endAt ?? null,
    },
  },
});

interface FlashDealCardProps {
  deal: FlashDeal;
}

const FlashDealCard = ({ deal }: FlashDealCardProps) => {
  const soldPercent = Math.min(100, Math.max(0, deal.soldPercent));
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(deal.image) && !imageError;

  return (
    <article className="
      group relative flex flex-col overflow-hidden
      border border-[var(--dni-cart-border)] bg-white
      transition-[border-color,box-shadow,background-color] duration-150
      hover:border-[var(--dni-primary)] hover:ring-1 hover:ring-[var(--dni-primary)] hover:bg-[var(--dni-primary-soft)]
    ">
      <Link
        to={renderDealHref(deal)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="relative w-full shrink-0 overflow-hidden bg-[#fafafa] pt-[100%]">
          {showImage ? (
            <img
              src={productServiceAssetUrl(deal.image)}
              alt={deal.name}
              onError={() => setImageError(true)}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover p-2"
              loading="lazy"
            />
          ) : (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-2">
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-md bg-[#f1f3f5] text-slate-300">
                <ImageOff className="h-8 w-8" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  No image
                </span>
              </div>
            </div>
          )}

          <span className="pointer-events-none absolute left-2 top-2 inline-flex max-w-[60%] items-center gap-1 bg-[var(--dni-primary)] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            <Flame className="h-3 w-3 shrink-0 fill-current" />
            Mall
          </span>

          <span className="pointer-events-none absolute right-2 top-2 inline-flex items-center bg-white/95 px-2 py-1 text-[10px] font-black text-[var(--dni-primary)] shadow-sm backdrop-blur-sm">
            -{deal.discount}%
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-base font-bold leading-none text-[var(--dni-primary)]">
              {formatProductPrice(deal.price)}
            </span>
            <span className="text-sm text-slate-400 line-through font-medium">
              {formatProductPrice(deal.originalPrice)}
            </span>
          </div>

          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-slate-800">
            {deal.name}
          </h3>

          <div className="mt-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--dni-primary)] to-[var(--dni-primary-400)]"
                  style={{ width: `${soldPercent}%` }}
                />
              </div>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {deal.soldOut ? "SOLD OUT" : `${soldPercent}% SOLD`}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {deal.cta === "buy-now" && (
        <div className="shrink-0 border-t border-[var(--dni-cart-border)] p-3">
          <Link
            to={renderDealHref(deal)}
            className="flex items-center justify-center bg-[var(--dni-primary)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-[var(--dni-primary-hover)] transition-colors"
          >
            Buy Now
          </Link>
        </div>
      )}

      {deal.cta === "remind-me" && (
        <div className="shrink-0 border-t border-[var(--dni-cart-border)] p-3">
          <button
            type="button"
            aria-label="Remind me when this deal goes live"
            className="flex w-full items-center justify-center gap-1.5 border border-[var(--dni-primary)] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--dni-primary)] hover:bg-[var(--dni-primary-soft)] transition-colors cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5" />
            Remind Me
          </button>
        </div>
      )}
    </article>
  );
};

export default FlashDealCard;