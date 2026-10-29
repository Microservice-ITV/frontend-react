import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import FlashDealCard from "../components/FlashDealCard";
import FlashDealCountdown from "../components/FlashDealCountdown";
import {
  getFlashDealsByTimeSlot,
  type FlashDealApiItem,
  type FlashDealTimeSlot,
} from "@/lib/api/flashDealClient";
import { FLASH_DEAL_STOREFRONT_REFRESH_MS } from "../lib/flashDealStorefront";

/** 24h "HH:MM" — deal-drop times, repeating daily. */
const DEAL_SLOTS = [
  { time: "10:30", label: "Morning Rush" },
  { time: "12:30", label: "Lunch Deals" },
  { time: "16:30", label: "Afternoon Picks" },
  { time: "18:30", label: "Evening Specials" },
];

type DealSlotStatus = "live" | "next" | "upcoming";

const getNextSessionEnd = () => {
  const end = new Date();
  end.setMinutes(0, 0, 0);
  end.setHours(end.getHours() + 1);
  return end;
};

function parseSlotTime(time: string, base: Date): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function formatSlotCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

const CARD_WIDTH_PX = 220;
const GAP_PX = 16;

const FlashDealsPage = () => {
  const [items, setItems] = useState<FlashDealApiItem[]>([]);
  const [slots, setSlots] = useState<FlashDealTimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Top Picks");
  const [timeLeft, setTimeLeft] = useState(() => {
    const end = getNextSessionEnd();
    return Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
  });
  const [now, setNow] = useState(() => new Date());
  const [countdownEndMs, setCountdownEndMs] = useState<number>(() =>
    getNextSessionEnd().getTime(),
  );
  const [refreshTick, setRefreshTick] = useState(0);
  const hasLoadedRef = useRef(false);

  // Deals published a moment ago must appear without a manual reload.
  useEffect(() => {
    const bump = () => setRefreshTick((tick) => tick + 1);
    const timer = window.setInterval(bump, FLASH_DEAL_STOREFRONT_REFRESH_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") bump();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Only the initial fetch shows skeletons; later refreshes stay silent.
    // This must not be a "first run" flag: StrictMode runs the effect twice and
    // discards the first run, which would leave the skeletons up forever.
    if (!hasLoadedRef.current) setLoading(true);

    getFlashDealsByTimeSlot({ limit: 100, status: "all" })
      .then((res) => {
        if (cancelled) return;
        const allItems = res.data.items ?? [];
        const allSlots = res.data.timeSlots ?? [];
        setItems(allItems);
        setSlots(allSlots);
        const live = allSlots.find((s) => s.isActive);
        if (live) {
          const ends = allItems
            .filter((item) => item.slot === live.time && item.endAt)
            .map((item) => {
              const t = item.endAt ? new Date(item.endAt).getTime() : 0;
              return Number.isFinite(t) && t > 0 ? t : 0;
            })
            .filter((t) => t > 0);
          if (ends.length > 0) setCountdownEndMs(Math.max(...ends));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setSlots([]);
      })
      .finally(() => {
        if (cancelled) return;
        hasLoadedRef.current = true;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  useEffect(() => {
    if (!selectedSlotTime) return;
    let cancelled = false;
    getFlashDealsByTimeSlot({
      limit: 100,
      status: "all",
      slotTime: selectedSlotTime,
    })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSlotTime, refreshTick]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(
        Math.max(0, Math.floor((countdownEndMs - Date.now()) / 1000)),
      );
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownEndMs]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const categories = useMemo(() => {
    const tags = Array.from(
      new Set(
        items
          .map((item) => item.tag)
          .filter((tag): tag is string => Boolean(tag)),
      ),
    );
    return ["Top Picks", ...tags];
  }, [items]);

  const filteredDeals = useMemo(() => {
    return items.filter(
      (deal) =>
        activeCategory === "Top Picks" || deal.tag === activeCategory,
    );
  }, [items, activeCategory]);

  // Which slot is live/next/upcoming, computed from the clock — no manual
  // isActive flag needed. The live slot (or, before the first drop, the
  // next one) is always rotated to the front of the array.
  const dealSlots = useMemo(() => {
    const nowMs = now.getTime();

    const liveIndex = slots.findIndex((slot) => slot.isActive);

    let nextIndex: number;
    if (liveIndex === -1) {
      nextIndex = 0;
    } else if (liveIndex + 1 < slots.length) {
      nextIndex = liveIndex + 1;
    } else {
      nextIndex = 0;
    }

    const withStatus = slots.map((slot, index) => {
      if (index === liveIndex) {
        const ms = Math.max(0, countdownEndMs - nowMs);
        return {
          ...slot,
          status: "live" as DealSlotStatus,
          countdown: `Ends in ${formatSlotCountdown(ms)}`,
        };
      }
      if (index === nextIndex) {
        const d = parseSlotTime(slot.time, new Date(nowMs));
        if (d.getTime() < nowMs) d.setDate(d.getDate() + 1);
        const ms = Math.max(0, d.getTime() - nowMs);
        return {
          ...slot,
          status: "next" as DealSlotStatus,
          countdown: `Starts in ${formatSlotCountdown(ms)}`,
        };
      }
      return {
        ...slot,
        status: "upcoming" as DealSlotStatus,
        countdown: `Starts at ${slot.time}`,
      };
    });

    const rotateFrom = liveIndex === -1 ? nextIndex : liveIndex;
    return [
      ...withStatus.slice(rotateFrom),
      ...withStatus.slice(0, rotateFrom),
    ];
  }, [slots, now, countdownEndMs]);

  const handleSlotSelect = (time: string) => {
    setSelectedSlotTime((prev) => (prev === time ? null : time));
  };

  return (
    <div className="bg-[#f5f5f5] text-gray-900">
      <section className="border-[var(--dni-border)] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-1.5 sm:flex-nowrap sm:px-6">
          <span className="hidden h-px w-10 bg-[#d1d5db] sm:block" />
          <div className="flex items-center gap-1.5 text-[var(--dni-primary)]">
            <Zap size={18} className="fill-current" aria-hidden />
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
              label="Ends Soon"
            />
          </div>
          <span className="hidden h-px w-10 bg-[#d1d5db] sm:block" />
        </div>
      </section>

      <section className="py-4 bg-[#ffffff]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0 sm:snap-none">
            {dealSlots.map((slot, index) => (
              <div
                key={slot.time}
                className="flex items-center gap-2.5 snap-start"
              >
                {index > 0 && (
                  <div className="h-px w-4 shrink-0 bg-[#d0d3d6]" />
                )}

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSlotSelect(slot.time)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSlotSelect(slot.time);
                    }
                  }}
                  className={`relative flex h-[60px] w-[168px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-4 text-center sm:h-[64px] sm:w-[200px] ${
                    slot.status === "live"
                      ? "bg-[var(--dni-primary)] text-white shadow-sm"
                      : slot.status === "next"
                        ? "border border-[#f0b429] bg-[#fff8e8]"
                        : "border border-[#e5e7eb] bg-white opacity-70"
                  }`}
                >
                  {slot.status === "live" && (
                    <span className="absolute right-3 top-3 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-white/70" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                    </span>
                  )}

                  <span
                    className={`text-base font-bold tracking-tight sm:text-lg ${
                      slot.status === "live"
                        ? "text-white"
                        : slot.status === "next"
                          ? "text-[#8a5a00]"
                          : "text-[#6b7280]"
                    }`}
                  >
                    {slot.time}
                  </span>
                  <span
                    className={`text-[11px] font-medium ${
                      slot.status === "live"
                        ? "text-white/85"
                        : slot.status === "next"
                          ? "text-[#b45309]"
                          : "text-[#9ca3af]"
                    }`}
                  >
                    {slot.countdown}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--dni-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-[52px] items-stretch gap-0 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`min-w-[150px] shrink-0 border-b-[3px] px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? "border-[var(--dni-primary)] text-[var(--dni-primary)]"
                    : "border-transparent text-[#4b5563] hover:text-[#111827]"
                }`}
              >
                {category}
              </button>
            ))}
            {/* <button
              type="button"
              className="ml-auto inline-flex min-w-[110px] shrink-0 items-center justify-center gap-1 border-l border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151]"
            >
              More
              <ArrowRight size={14} className="text-[var(--dni-primary)]" />
            </button> */}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f5f5] py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="border border-[var(--dni-cart-border)] bg-white p-4">
            {loading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 sm:gap-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={`skeleton-${idx}`}
                    className="flex flex-col overflow-hidden border border-[var(--dni-cart-border)] bg-white"
                  >
                    <div className="aspect-square animate-pulse bg-[#f0f0f0]" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-1/2 animate-pulse bg-[#f0f0f0]" />
                      <div className="h-3 w-3/4 animate-pulse bg-[#f0f0f0]" />
                      <div className="h-5 w-full animate-pulse bg-[#f0f0f0]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 px-4 text-center">
                <Zap size={28} className="fill-[var(--dni-primary-50)] text-[var(--dni-primary)]" />
                <p className="text-sm font-medium text-slate-500">
                  No flash deals available right now
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 sm:gap-4">
                {filteredDeals.map((deal) => (
                  <FlashDealCard key={deal.id} deal={deal} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FlashDealsPage;