import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import type { FlashDealApiItem } from "@/lib/api/flashDealClient";
import { formatProductPrice } from "@/features/products/utils/formatProductPrice";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

interface FlashDealCardProps {
  deal: FlashDealApiItem;
}

const FlashDealCard = ({ deal }: FlashDealCardProps) => {
  const productImage =
    deal.image && deal.image.trim() !== "" ? deal.image : PLACEHOLDER_IMAGE;

  const productName =
    deal.name?.trim() !== "" ? deal.name : deal.flashDealName || "Flash Deal";

  const dealPrice = Number(deal.dealPrice) || 0;
  const originalPrice = Number(deal.originalPrice) || 0;

  const discount =
    originalPrice > 0
      ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100)
      : Number(deal.discount) || 0;

  const allocated = Number(deal.allocatedQuantity) || 0;
  const remaining = Number(deal.remainingQuantity);
  const computedSoldStock = Number.isFinite(remaining)
    ? Math.max(0, allocated - remaining)
    : Number.NaN;
  const soldPercent =
    allocated > 0 && Number.isFinite(computedSoldStock)
      ? Math.min(100, Math.round((computedSoldStock / allocated) * 100))
      : Number(deal.stockProgress) || 0;

  const stockText =
    deal.stockText ||
    (deal.soldOut ? "SOLD OUT" : `${soldPercent}% SOLD`);

  const isHighUrgency = soldPercent >= 90;
  const isMediumUrgency = soldPercent >= 75;

  return (
    <article className="
      group relative flex h-full w-full min-w-0 flex-col overflow-hidden
      border border-[var(--dni-cart-border)] bg-white
      transition-[border-color,background-color] duration-150
      hover:border-[var(--dni-primary)] hover:bg-[var(--dni-primary-soft)]
    ">
      <Link
        to={`/products/${deal.productId}`}
        state={{
          flashDealPromo: {
            flashDealId: deal.flashDealId,
            flashDealItemId: deal.id,
            originalPrice,
            promoPrice: dealPrice,
            discount,
            startAt: deal.startAt ?? null,
            endAt: deal.endAt ?? null,
          },
        }}
        className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col"
      >
        <div className="relative w-full shrink-0 bg-[#fafafa] pt-[100%]">
          <img
            src={productImage}
            alt={productName}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover p-2"
            loading="lazy"
          />

          <div className="absolute left-2 top-2 flex gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--dni-primary)] text-[10px] font-bold text-white">
              <span className="text-xs leading-none" aria-hidden>
                ⚡
              </span>
              Flash
            </span>
            <span className="inline-flex items-center px-2 py-1 bg-white/95 backdrop-blur-sm text-[10px] font-black text-[var(--dni-primary)]">
              -{discount}%
            </span>
          </div>

          {/* <div className="absolute right-2 bottom-2">
            <span className={`
              inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide
              ${isHighUrgency ? 'bg-red-500 text-white' : isMediumUrgency ? 'bg-orange-500 text-white' : 'bg-[var(--dni-primary)] text-white'}
            `}>
              <Flame className="h-3 w-3 fill-current" />
              {stockText}
            </span>
          </div> */}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-none tracking-tight text-[var(--dni-primary)]">
              {formatProductPrice(dealPrice)}
            </p>
            {originalPrice > dealPrice && (
              <p className="mt-1 truncate text-xs font-medium text-slate-400 line-through">
                {formatProductPrice(originalPrice)}
              </p>
            )}
          </div>

          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-slate-800">
            {productName}
          </h3>

          <div className="mt-auto">
            <div className="relative h-5 overflow-hidden bg-slate-300">
              <div
                className="h-full bg-gradient-to-r from-[var(--dni-primary)] to-[var(--dni-primary-400)]"
                style={{ width: `${soldPercent}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-black text-white">
                <Flame className="h-4 w-4 fill-white" />
                <span>{stockText}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default FlashDealCard;