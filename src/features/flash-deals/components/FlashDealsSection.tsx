import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Flame } from "lucide-react";
import { flashDealApi, type ActiveFlashDealItem } from "@/lib/api/flashDealClient";
import { productServiceAssetUrl } from "@/lib/api/apiConfig";

const FlashDealsSection = () => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [deals, setDeals] = useState<ActiveFlashDealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const dealsTrackRef = useRef<HTMLDivElement | null>(null);
  const endAtTargetRef = useRef<number | null>(null);
  const serverTimeOffsetRef = useRef(0);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const data = await flashDealApi.getActiveFlashDeals(10);
        setDeals(data.items);
        serverTimeOffsetRef.current = Date.parse(data.serverTime) - Date.now();
        const nearestEnd = data.items.reduce<number | null>(
          (min, deal) => {
            const end = Date.parse(deal.endAt);
            return min === null || end < min ? end : min;
          },
          null,
        );
        endAtTargetRef.current = nearestEnd;
        setTimeLeft(nearestEnd === null ? null : Math.max(0, nearestEnd + serverTimeOffsetRef.current - Date.now()));
      } catch (error) {
        console.error('Failed to fetch flash deals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const target = endAtTargetRef.current;
      if (target === null) return;
      const remaining = Math.max(0, target + serverTimeOffsetRef.current - Date.now());
      setTimeLeft(Math.floor(remaining / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = timeLeft === null ? 0 : Math.floor(timeLeft / 3600);
  const minutes = timeLeft === null ? 0 : Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft === null ? 0 : timeLeft % 60;

  const timerBlocks = [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ];

  const scrollDeals = (direction: "next") => {
    const travel = dealsTrackRef.current;
    if (!travel) return;

    const cards = Array.from(
      travel.querySelectorAll<HTMLElement>("[data-deal-card]"),
    );
    const step = cards.length ? cards[0].offsetWidth + 12 : 220;

    travel.scrollBy({
      left: direction === "next" ? step : -step,
      behavior: "smooth",
    });
  };

  const renderHeader = () => (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[var(--dni-primary)]">
          <Flame className="h-6 w-6 fill-[var(--dni-primary)]" />
          <span className="text-xl font-black uppercase tracking-[0.04em] text-[var(--dni-primary)]">
            Flash Deals
          </span>
        </div>

        {timeLeft !== null && (
          <div className="flex items-center gap-1">
            {timerBlocks.map((block, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="flex h-7 min-w-[28px] items-center justify-center bg-[var(--dni-primary)] px-1 text-[11px] font-black text-white">
                  {block}
                </span>
                {idx < 2 && (
                  <span className="text-[11px] font-black text-[#374151]">
                    :
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        to="/flash-deals"
        className="group inline-flex items-center gap-1 text-sm font-semibold text-[var(--dni-primary)]"
      >
        <span>See All</span>
        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </div>
  );

  if (loading) {
    return (
      <section className="relative w-full border border-gray-100 bg-white p-4">
        {renderHeader()}

        <div className="group relative">
          <div
            ref={dealsTrackRef}
            className="scrollbar-hide flex gap-3 overflow-x-auto pb-1"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                data-deal-card
                className="w-[180px] min-w-[180px] snap-start border border-gray-100 bg-white shadow-[0_2px_0_rgba(17,24,39,0.02)] animate-pulse sm:w-[200px] sm:min-w-[200px]"
              >
                <div className="relative">
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#fafafa]">
                    <div className="absolute inset-0 bg-slate-100" />
                    <span className="absolute left-2 top-2 z-10 bg-[var(--dni-primary)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                      Mall
                    </span>
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  <div className="h-6 bg-slate-100 rounded w-24 mx-auto" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-full w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (deals.length === 0 || timeLeft === null) {
    return (
      <section className="relative w-full border border-gray-100 bg-white p-4">
        {renderHeader()}

        <div className="text-center py-8 text-slate-500 text-sm">
          No active flash deals at the moment.
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full border border-gray-100 bg-white p-4">
      {renderHeader()}

      <div className="group relative">
        <div
          ref={dealsTrackRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto pb-1"
        >
          {deals.map((deal) => (
            <div
              key={deal.id}
              data-deal-card
              className="w-[180px] min-w-[180px] snap-start border border-gray-100 bg-white shadow-[0_2px_0_rgba(17,24,39,0.02)] transition-all hover:border-emerald-200 hover:shadow-[0_4px_18px_rgba(17,24,39,0.06)] sm:w-[200px] sm:min-w-[200px]"
            >
              <div className="relative">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#fafafa]">
                  <img
                    src={deal.image ? productServiceAssetUrl(deal.image) : ''}
                    alt={deal.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-2 top-2 z-10 bg-[var(--dni-primary)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                    Mall
                  </span>
                  <span className="absolute right-2 top-2 z-10 bg-[#f7f7f7] px-1.5 py-0.5 text-[10px] font-black text-[var(--dni-primary)]">
                    -{deal.discount}%
                  </span>
                </div>
              </div>

              <div className="space-y-2 p-3">
                <div className="flex items-baseline justify-center gap-1 text-[var(--dni-primary)]">
                  <span className="text-lg font-black leading-none">
                    ${deal.price.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#9ca3af] line-through">
                    ${deal.originalPrice.toFixed(2)}
                  </span>
                </div>

                <p className="min-h-[2.75rem] text-center text-[12px] font-medium leading-4 text-[#1f2937]">
                  {deal.name}
                </p>

                <div className="relative h-4 overflow-hidden bg-gray-100">
                  <div
                    className="h-full bg-[var(--dni-primary)]"
                    style={{ width: `${Math.min(100, deal.soldPercent)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-1 text-[9px] font-bold text-white">
                    <Flame className="h-2.5 w-2.5 fill-white" />
                    <span>{deal.stockText}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Next Flash Deals"
          onClick={() => scrollDeals("next")}
          className="absolute -right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 opacity-0 shadow-[0_4px_12px_rgba(17,24,39,0.08)] transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-gray-50 hover:text-[var(--dni-primary)]"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
};

export default FlashDealsSection;