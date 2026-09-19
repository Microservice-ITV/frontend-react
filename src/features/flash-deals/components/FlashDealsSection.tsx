import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { flashDealApi, type ActiveFlashDealItem } from "@/lib/api/flashDealClient";
import { productServiceAssetUrl } from "@/lib/api/apiConfig";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import FlashDealCard from "./FlashDealCard";

const FLASH_DEALS = [
  {
    id: 1,
    name: "Wireless Earbuds Pro",
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
    price: 19.98,
    originalPrice: 59.9,
    discount: 67,
    stockText: "ONLY 8 LEFT",
    soldPercent: 85,
  },
  {
    id: 2,
    name: "Premium Ceramic Cookware Set",
    image:
      "https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=900&q=80",
    price: 20.7,
    originalPrice: 129,
    discount: 65,
    stockText: "SELLING FAST",
    soldPercent: 70,
  },
  {
    id: 3,
    name: "Hydrating Lip Tint Trio",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
    price: 42.5,
    originalPrice: 89.9,
    discount: 17,
    stockText: "SELLING FAST",
    soldPercent: 60,
  },
  {
    id: 4,
    name: "Mini Robot Vacuum",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
    price: 114.5,
    originalPrice: 199,
    discount: 25,
    stockText: "SELLING FAST",
    soldPercent: 75,
  },
  {
    id: 5,
    name: "Organic Baby Skincare Kit",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80",
    price: 17.7,
    originalPrice: 54.9,
    discount: 43,
    stockText: "ONLY 8 LEFT",
    soldPercent: 90,
  },
  {
    id: 6,
    name: "Athletic Running Shoes",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    price: 26.6,
    originalPrice: 79.9,
    discount: 43,
    stockText: "ONLY 4 LEFT",
    soldPercent: 95,
  },
];

const CARD_WIDTH_PX = 220;
const GAP_PX = 16;
const COLUMNS_PER_STEP = 4;

const getNextSessionEnd = () => {
  const end = new Date();
  end.setMinutes(0, 0, 0);
  end.setHours(end.getHours() + 1);
  return end;
};

const pad = (value: number) => String(value).padStart(2, "0");

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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [timeLeft, setTimeLeft] = useState(() => {
    const end = getNextSessionEnd();
    return Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1)
          return Math.max(
            0,
            Math.floor((getNextSessionEnd().getTime() - Date.now()) / 1000),
          );
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = timeLeft === null ? 0 : Math.floor(timeLeft / 3600);
  const minutes = timeLeft === null ? 0 : Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft === null ? 0 : timeLeft % 60;

  const timerBlocks = [pad(hours), pad(minutes), pad(seconds)];

  const updateScrollAffordance = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const epsilon = 8;
    setCanScrollLeft(scrollLeft > epsilon);
    setCanScrollRight(maxScroll > epsilon && scrollLeft < maxScroll - epsilon);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateScrollAffordance();
    el.addEventListener("scroll", updateScrollAffordance, { passive: true });
    el.addEventListener("scrollend", updateScrollAffordance);
    const ro = new ResizeObserver(() => updateScrollAffordance());
    ro.observe(el);

    const t = window.setTimeout(updateScrollAffordance, 100);

    return () => {
      el.removeEventListener("scroll", updateScrollAffordance);
      el.removeEventListener("scrollend", updateScrollAffordance);
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [updateScrollAffordance]);

  const scrollByStep = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = (CARD_WIDTH_PX + GAP_PX) * COLUMNS_PER_STEP;
    el.scrollBy({
      left: direction === "left" ? -step : step,
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
  return (
    <section className="relative w-full border border-[var(--dni-cart-border)] bg-white">
      <div className="flex items-center gap-4 px-4 py-4 border-b border-[var(--dni-cart-border)]">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[var(--dni-primary)]">
            <Flame className="h-7 w-7 fill-[var(--dni-primary)]" />
            <span className="text-xl font-black uppercase tracking-tight">
              Flash
            </span>
            <span className="text-xl font-medium uppercase tracking-tight">
              Deals
            </span>
          </div>

          <div className="flex items-center gap-2 ml-4 border-l border-[var(--dni-cart-border)] pl-4">
            <div className="flex items-center gap-1.5">
              {timerBlocks.map((block, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="relative flex h-10 min-w-[36px] items-center justify-center overflow-hidden bg-[var(--dni-primary)] px-2 text-sm font-bold text-white font-mono shadow-inner">
                    <span className="absolute inset-x-0 top-0 h-1/2 border-b border-white/10 bg-[var(--dni-primary)]" />
                    <span className="relative">{block}</span>
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {[":", ":", ":"][idx]}
                  </span>
                </div>
              ))}
            </div>
            <span className="ml-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Ends Soon
            </span>
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

      <div className="relative px-4 py-4">
        {canScrollLeft && (
          <button
            type="button"
            aria-label="Previous flash deals"
            onClick={() => scrollByStep("left")}
            className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition duration-200 hover:scale-115 hover:bg-gray-50 hover:border-[var(--dni-primary)] cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        )}

        <div
          ref={scrollerRef}
          className="overflow-x-auto overflow-y-hidden scrollbar-hide"
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
          <div
            className="flex min-w-max gap-4"
            style={{ width: `max-content` }}
          >
            {FLASH_DEALS.map((deal) => (
              <div
                key={deal.id}
                className="shrink-0"
                style={{ width: `${CARD_WIDTH_PX}px` }}
              >
                <FlashDealCard deal={deal} />
              </div>
            ))}
          </div>
        </div>

        {canScrollRight && (
          <button
            type="button"
            aria-label="Next flash deals"
            onClick={() => scrollByStep("right")}
            className="absolute right-0 top-1/2 z-10 flex h-8 w-8 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition duration-200 hover:scale-115 hover:bg-gray-50 hover:border-[var(--dni-primary)] cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>
    </section>
  );
};

export default FlashDealsSection;