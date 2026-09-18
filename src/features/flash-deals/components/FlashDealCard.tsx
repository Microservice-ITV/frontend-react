import { Link } from "react-router-dom";
import { Flame } from "lucide-react";

interface FlashDeal {
  id: number;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  discount: number;
  stockText: string;
  soldPercent: number;
}

interface FlashDealCardProps {
  deal: FlashDeal;
}

const FlashDealCard = ({ deal }: FlashDealCardProps) => {
  const isHighUrgency = deal.soldPercent >= 90;
  const isMediumUrgency = deal.soldPercent >= 75;

  return (
    <article className="
      group relative flex h-full flex-col overflow-hidden
      border border-[var(--dni-cart-border)] bg-white
      transition-[border-color,background-color] duration-150
      hover:border-[var(--dni-primary)] hover:bg-[var(--dni-primary-soft)]
    ">
      <Link
        to={`/products/${deal.id}`}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="relative w-full shrink-0 bg-[#fafafa] pt-[100%]">
          <img
            src={deal.image}
            alt={deal.name}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover p-2"
            loading="lazy"
          />

          <div className="absolute left-2 top-2 flex gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--dni-primary)] text-[10px] font-bold text-white">
              <Flame className="h-3 w-3 fill-current" />
              Flash
            </span>
            <span className="inline-flex items-center px-2 py-1 bg-white/95 backdrop-blur-sm text-[10px] font-black text-[var(--dni-primary)]">
              -{deal.discount}%
            </span>
          </div>

          {/* <div className="absolute right-2 bottom-2">
            <span className={`
              inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide
              ${isHighUrgency ? 'bg-red-500 text-white' : isMediumUrgency ? 'bg-orange-500 text-white' : 'bg-[var(--dni-primary)] text-white'}
            `}>
              <Flame className="h-3 w-3 fill-current" />
              {deal.stockText}
            </span>
          </div> */}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-base font-bold leading-none text-[var(--dni-primary)]">
              MMK{deal.price.toFixed(2)}
            </span>
            <span className="text-sm text-slate-400 line-through font-medium">
              MMK{deal.originalPrice.toFixed(2)}
            </span>
          </div>

          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-slate-800">
            {deal.name}
          </h3>

          <div className="mt-auto">
            <div className="relative h-5 overflow-hidden bg-slate-300">
              <div
                className="h-full bg-gradient-to-r from-[var(--dni-primary)] to-[var(--dni-primary-400)]"
                style={{ width: `${deal.soldPercent}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-black text-white">
                <Flame className="h-4 w-4 fill-white" />
                <span>{deal.stockText}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default FlashDealCard;