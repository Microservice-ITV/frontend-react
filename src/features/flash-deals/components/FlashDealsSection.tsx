import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import FlashDealCard from "./FlashDealCard";
import {
  getFlashDealsByTimeSlot,
  type FlashDealApiItem,
} from "@/lib/api/flashDealClient";

interface SectionDeal {
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
}

const CARD_WIDTH_PX = 220;
const GAP_PX = 16;
const COLUMNS_PER_STEP = 4;

const pad = (value: number) => String(value).padStart(2, "0");

const getNextSessionEnd = (from: Date) => {
  const end = new Date(from);
  end.setMinutes(0, 0, 0);
  end.setHours(end.getHours() + 1);
  return end;
};

const normalizeDeal = (item: FlashDealApiItem): SectionDeal => ({
  id: item.id,
  productId: item.productId,
  flashDealId: item.flashDealId,
  name: item.name,
  image: item.image,
  price: Number(item.dealPrice) || 0,
  originalPrice: Number(item.originalPrice) || 0,
  discount: item.discount,
  stockText: item.stockText,
  soldPercent: item.stockProgress,
  soldOut: item.soldOut,
  startAt: item.startAt,
  endAt: item.endAt,
});

const FlashDealsSection = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [deals, setDeals] = useState<SectionDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [countdownTargetMs, setCountdownTargetMs] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const syncedNow = () => new Date(Date.now() - serverOffsetMs);

  const pickCountdownTarget = useCallback(
    (items: SectionDeal[]) => {
      const now = syncedNow();
      const ongoingEnds = items
        .flatMap((item) =>
          item.startAt && item.endAt
            ? [
                {
                  start: new Date(item.startAt).getTime(),
                  end: new Date(item.endAt).getTime(),
                },
              ]
            : [],
        )
        .filter((window) => window.start <= now.getTime() && window.end > now.getTime())
        .map((window) => window.end);

      if (ongoingEnds.length > 0) {
        return Math.min(...ongoingEnds);
      }

      return getNextSessionEnd(now).getTime();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverOffsetMs],
  );

  useEffect(() => {
    let cancelled = false;

    const loadDeals = async () => {
      try {
        const res = await getFlashDealsByTimeSlot({ limit: 12 });
        if (cancelled) return;

        const offset = Date.now() - new Date(res.data.serverTime).getTime();
        const items = (res.data.items ?? []).map(normalizeDeal);

        setServerOffsetMs(offset);
        setDeals(items);
        setCountdownTargetMs(pickCountdownTarget(items));
      } catch (err) {
        console.error("Failed to load flash deals:", err);
        if (!cancelled) setError("Failed to load flash deals.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDeals();
    return () => {
      cancelled = true;
    };
  }, [pickCountdownTarget]);

  useEffect(() => {
    const timer = setInterval(() => {
      const target = countdownTargetMs;
      if (target === null) return;

      const remaining = Math.max(
        0,
        Math.floor((target - syncedNow().getTime()) / 1000),
      );

      if (remaining === 0) {
        setCountdownTargetMs(pickCountdownTarget(deals));
        return;
      }
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownTargetMs, deals, pickCountdownTarget]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

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
  }, [updateScrollAffordance, loading, deals]);

  const scrollByStep = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = (CARD_WIDTH_PX + GAP_PX) * COLUMNS_PER_STEP;
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative w-full border border-[var(--dni-cart-border)] bg-white">
      <div className="flex items-center gap-4 px-4 py-4 border-b border-[var(--dni-cart-border)]">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[var(--dni-primary)]">
            <Flame className="h-7 w-7 fill-[var(--dni-primary)]" />
            <span className="text-xl font-black uppercase tracking-tight whitespace-nowrap">
              Flash Deals
            </span>
          </div>

          <div className="hidden items-center gap-2 border-l border-[var(--dni-cart-border)] pl-4 sm:flex">
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
        </div>

        <Link
          to="/flash-deals"
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[var(--dni-primary)] hover:text-[var(--dni-primary-hover)] transition-colors"
        >
          <span>
            See All
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
              &nbsp;&gt;
            </span>
          </span>
        </Link>
      </div>

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
          <div
            className="flex min-w-max gap-4"
            style={{ width: `max-content` }}
          >
            {loading && (
              <>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="shrink-0"
                    style={{ width: `${CARD_WIDTH_PX}px` }}
                  >
                    <div className="flex h-full min-h-[280px] flex-col border border-[var(--dni-cart-border)] bg-white">
                      <div className="aspect-square w-full animate-pulse bg-[#e5e7eb]" />
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <div className="h-4 w-1/2 animate-pulse bg-[#e5e7eb]" />
                        <div className="h-4 w-3/4 animate-pulse bg-[#e5e7eb]" />
                        <div className="mt-auto h-5 w-full animate-pulse bg-[#e5e7eb]" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {!loading && error && (
              <div className="w-full rounded-lg border border-[#fecaca] bg-[#fef2f2] px-6 py-8 text-center">
                <p className="text-sm font-medium text-[#b91c1c]">{error}</p>
              </div>
            )}

            {!loading && !error && deals.length === 0 && (
              <div className="w-full rounded-lg border border-[var(--dni-border)] bg-white px-6 py-8 text-center">
                <p className="text-sm font-medium text-[#4b5563]">
                  No flash deals available right now.
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              deals.map((deal) => (
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