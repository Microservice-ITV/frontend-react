import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import FlashDealCard from "./FlashDealCard";
import FlashDealCountdown from "./FlashDealCountdown";
import { useHomeFlashDealsQuery } from "@/features/home/queries/homeQueries";
import { useReportHomeSection } from "@/features/home/homeScreenReady";

const CARD_WIDTH_PX = 220;
const GAP_PX = 16;
const COLUMNS_PER_STEP = 4;

const getNextSessionEnd = () => {
  const end = new Date();
  end.setMinutes(0, 0, 0);
  end.setHours(end.getHours() + 1);
  return end;
};

const FlashDealsSection = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data: deals = [], isPending, isFetched, isFetching } =
    useHomeFlashDealsQuery();
  // Splash / section ready: first fetch finished (later polls stay silent).
  useReportHomeSection("flashDeals", isFetched);

  const { countdownLabel, endTime } = useMemo(() => {
    const now = Date.now();
    const windows = deals
      .map((item) => ({
        start: item.startAt ? new Date(item.startAt).getTime() : 0,
        end: item.endAt ? new Date(item.endAt).getTime() : 0,
      }))
      .filter(
        (window) =>
          Number.isFinite(window.start) &&
          Number.isFinite(window.end) &&
          window.end > now,
      );

    const activeEnds = windows
      .filter((window) => window.start <= now)
      .map((window) => window.end);
    if (activeEnds.length > 0) {
      return {
        countdownLabel: "Ends Soon",
        endTime: Math.min(...activeEnds),
      };
    }

    const upcomingStarts = windows
      .map((window) => window.start)
      .filter((start) => start > now);
    if (upcomingStarts.length > 0) {
      return {
        countdownLabel: "Starts In",
        endTime: Math.min(...upcomingStarts),
      };
    }

    return {
      countdownLabel: "Ends Soon",
      endTime: getNextSessionEnd().getTime(),
    };
  }, [deals]);

  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, Math.floor((endTime - Date.now()) / 1000)),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

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
  }, [updateScrollAffordance, deals.length, isPending, isFetching]);

  const scrollByStep = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = (CARD_WIDTH_PX + GAP_PX) * COLUMNS_PER_STEP;
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  // Avoid skeleton → empty collapse (CLS). Stay hidden until we know there are deals.
  if (isPending || deals.length === 0) return null;

  return (
    <section className="relative w-full border border-[var(--dni-cart-border)] bg-white">
      <div className="flex items-center gap-4 px-4 py-4 border-b border-[var(--dni-cart-border)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[var(--dni-primary)]">
            <Zap className="h-7 w-7 fill-[var(--dni-primary)]" aria-hidden />
            <span className="text-xl font-black uppercase tracking-tight">
              Flash
            </span>
            <span className="text-xl font-medium uppercase tracking-tight">
              Deals
            </span>
          </div>

          <div className="border-[var(--dni-cart-border)] sm:ml-2 sm:border-l sm:pl-4">
            <FlashDealCountdown
              hours={hours}
              minutes={minutes}
              seconds={seconds}
              label={countdownLabel}
            />
          </div>
        </div>

        <Link
          to="/flash-deals"
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[var(--dni-primary)] hover:text-[var(--dni-primary-hover)] transition-colors"
        >
          <span>View All</span>
          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
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
            style={{ width: "max-content" }}
          >
            {deals.map((deal) => (
              <div
                key={deal.id}
                className="min-w-0 shrink-0"
                style={{ width: CARD_WIDTH_PX, maxWidth: CARD_WIDTH_PX }}
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
