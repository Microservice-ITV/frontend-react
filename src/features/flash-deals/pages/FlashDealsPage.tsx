import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Flame } from "lucide-react";
import FlashDealCard from "../components/FlashDealCard";
import {
  getFlashDealsByTimeSlot,
  type FlashDealApiItem,
  type FlashDealTimeSlot,
} from "@/lib/api/flashDealClient";

interface DealCategory {
  id: string;
  name: string;
}

interface Deal {
  id: string;
  productId: string;
  flashDealId: string;
  flashDealName: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  discount: number;
  sold: string;
  stockText: string;
  soldPercent: number;
  remainingQuantity: number;
  soldOut: boolean;
  startAt: string;
  endAt: string;
  slot: string;
  categoryId: string;
  categorySlug: string;
  category: string;
}

const pad = (value: number) => String(value).padStart(2, "0");

const getNextSessionEnd = (from: Date) => {
  const end = new Date(from);
  end.setMinutes(0, 0, 0);
  end.setHours(end.getHours() + 1);
  return end;
};

const normalizeDeal = (item: FlashDealApiItem): Deal => ({
  id: item.id,
  productId: item.productId,
  flashDealId: item.flashDealId,
  flashDealName: item.flashDealName,
  name: item.name,
  image: item.image,
  price: Number(item.dealPrice) || 0,
  originalPrice: Number(item.originalPrice) || 0,
  discount: item.discount,
  sold: item.sold,
  stockText: item.stockText,
  soldPercent: item.stockProgress,
  remainingQuantity: item.remainingQuantity,
  soldOut: item.soldOut,
  startAt: item.startAt,
  endAt: item.endAt,
  slot: item.slot,
  categoryId: item.categoryId,
  categorySlug: item.categorySlug,
  category: item.tag,
});

const slotKeyOf = (deal: Deal): string => {
  if (deal.slot) return deal.slot;
  const date = new Date(deal.startAt);
  if (Number.isNaN(date.getTime())) return "";
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
};

const FlashDealsPage = () => {
  const [categories, setCategories] = useState<DealCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState("Top Picks");
  const [timeSlots, setTimeSlots] = useState<FlashDealTimeSlot[]>([]);
  const [activeSlot, setActiveSlot] = useState<string>("all");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(() => {
    const next = getNextSessionEnd(new Date());
    return Math.max(0, Math.floor((next.getTime() - Date.now()) / 1000));
  });

  const syncedNow = useCallback(() => {
    if (!serverTime) return new Date();
    const offset = Date.now() - new Date(serverTime).getTime();
    return new Date(Date.now() - offset);
  }, [serverTime]);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFlashDealsByTimeSlot({ limit: 100, status: "all" });
      const items = res.data.items ?? [];

      setServerTime(res.data.serverTime ?? null);
      setTimeSlots(res.data.timeSlots ?? []);

      const normalized = items.map(normalizeDeal);
      setDeals(normalized);

      const dynamicCats = Array.from(
        new Set(normalized.map((item) => item.category).filter(Boolean)),
      ).map((name): DealCategory => ({ id: name, name }));
      setCategories([
        { id: "Top Picks", name: "Top Picks" },
        ...dynamicCats,
      ]);

      const firstOngoing =
        res.data.timeSlots?.find((slot) => slot.label === "Ongoing") ??
        res.data.timeSlots?.[0] ??
        null;
      setActiveSlot(firstOngoing ? firstOngoing.time : "all");
    } catch (err) {
      console.error("Failed to load flash deals:", err);
      setError("Failed to load flash deals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const slotDeals = useMemo(() => {
    if (activeSlot === "all") return deals;
    return deals.filter((deal) => slotKeyOf(deal) === activeSlot);
  }, [deals, activeSlot]);

  const activeSlotInfo = useMemo(
    () =>
      timeSlots.find((slot) => slot.time === activeSlot) ?? timeSlots[0] ?? null,
    [timeSlots, activeSlot],
  );

  const isOngoingSlot = activeSlotInfo?.label === "Ongoing";

  useEffect(() => {
    const timer = setInterval(() => {
      const now = syncedNow();

      const targetTimes = slotDeals
        .map((deal) =>
          isOngoingSlot
            ? new Date(deal.endAt).getTime()
            : new Date(deal.startAt).getTime(),
        )
        .filter((value) => !Number.isNaN(value));

      const target =
        targetTimes.length > 0
          ? Math.min(...targetTimes)
          : getNextSessionEnd(now).getTime();

      setTimeLeft(Math.max(0, Math.floor((target - now.getTime()) / 1000)));
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlotInfo, slotDeals, serverTime, isOngoingSlot]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const filteredDeals = slotDeals.filter(
    (deal) => activeCategory === "Top Picks" || deal.category === activeCategory,
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-900">
      <section className="border-b border-[var(--dni-border)] bg-white">
        <div className="mx-auto flex items-center justify-center gap-4 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2 text-[var(--dni-primary)]">
            <Flame size={22} className="fill-[var(--dni-primary)]" />
            <span className="text-xl font-black uppercase tracking-tight whitespace-nowrap">
              Flash Deals
            </span>
          </div>
          <div className="flex items-center gap-2 border-l border-[var(--dni-cart-border)] pl-4">
            <div className="flex items-center gap-1.5">
              {[pad(hours), pad(minutes), pad(seconds)].map((block, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className="relative flex h-10 min-w-[36px] items-center justify-center overflow-hidden bg-[var(--dni-primary)] px-2 text-sm font-bold text-white font-mono shadow-inner">
                    <span className="absolute inset-x-0 top-0 h-1/2 border-b border-white/10 bg-[var(--dni-primary)]" />
                    <span className="relative">{block}</span>
                  </span>
                  {index < 2 && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      :
                    </span>
                  )}
                </div>
              ))}
            </div>
            <span className="ml-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {isOngoingSlot ? "Ends Soon" : "Starts Soon"}
            </span>
          </div>
        </div>
      </section>

      <section className="py-4 bg-[#ffffff]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0 sm:snap-none">
            {loading && timeSlots.length === 0 && (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`slot-skeleton-${index}`}
                    className="h-[60px] w-[168px] shrink-0 animate-pulse rounded-lg border border-[#e5e7eb] bg-gray-50 sm:h-[64px] sm:w-[200px]"
                  />
                ))}
              </>
            )}

            {!loading && timeSlots.length === 0 && (
              <button
                type="button"
                onClick={() => setActiveSlot("all")}
                className={`flex h-[60px] w-[168px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-4 text-center sm:h-[64px] sm:w-[200px] ${
                  activeSlot === "all"
                    ? "bg-[var(--dni-primary)] text-white shadow-sm ring-2 ring-[var(--dni-primary)]"
                    : "border border-[#e5e7eb] bg-white opacity-70"
                }`}
              >
                <span className="text-base font-bold tracking-tight sm:text-lg">
                  All Deals
                </span>
                <span className="text-[11px] font-medium text-white/85">
                  View all slots
                </span>
              </button>
            )}

            {timeSlots.map((slot) => {
              const isSelected = activeSlot === slot.time;
              const isLive = slot.isActive;
              return (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => setActiveSlot(slot.time)}
                  className={`relative flex h-[60px] w-[168px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-4 text-center sm:h-[64px] sm:w-[200px] ${
                    isLive
                      ? "bg-[var(--dni-primary)] text-white shadow-sm"
                      : "border border-[#e5e7eb] bg-white opacity-80 hover:opacity-100"
                  } ${
                    isSelected
                      ? "ring-2 ring-[var(--dni-primary)] ring-offset-1"
                      : ""
                  }`}
                >
                  {isLive && (
                    <span className="absolute right-3 top-3 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-white/70" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                    </span>
                  )}

                  <span
                    className={`text-base font-bold tracking-tight sm:text-lg ${
                      isLive ? "text-white" : "text-slate-700"
                    }`}
                  >
                    {slot.time}
                  </span>

                  <span
                    className={`text-[11px] font-medium ${
                      isLive ? "text-white/85" : "text-slate-500"
                    }`}
                  >
                    {isLive ? "Ongoing" : "Upcoming"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--dni-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  activeCategory === category.id
                    ? "bg-[var(--dni-primary)] text-white"
                    : "bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f5f5] px-4 pb-10 pt-3 sm:px-6">
        <div className="mx-auto">
          {loading && (
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-3 items-stretch">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="flex h-full min-h-[280px] flex-col border border-[var(--dni-cart-border)] bg-white"
                >
                  <div className="aspect-square w-full animate-pulse bg-[#e5e7eb]" />
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="h-4 w-1/2 animate-pulse bg-[#e5e7eb]" />
                    <div className="h-4 w-3/4 animate-pulse bg-[#e5e7eb]" />
                    <div className="mt-auto h-5 w-full animate-pulse bg-[#e5e7eb]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="mx-auto max-w-7xl rounded-lg border border-[#fecaca] bg-[#fef2f2] px-6 py-10 text-center">
              <p className="text-sm font-medium text-[#b91c1c]">{error}</p>
              <button
                type="button"
                onClick={loadDeals}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[var(--dni-primary)]"
              >
                <ChevronRight size={14} className="rotate-90" />
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredDeals.length === 0 && (
            <div className="mx-auto max-w-7xl rounded-lg border border-[var(--dni-border)] bg-white px-6 py-10 text-center">
              <p className="text-sm font-medium text-[#4b5563]">
                No flash deals available right now.
              </p>
            </div>
          )}

          {!loading && !error && filteredDeals.length > 0 && (
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-3 items-stretch">
              {filteredDeals.map((deal) => (
                <FlashDealCard
                  key={deal.id}
                  deal={{
                    ...deal,
                    cta: isOngoingSlot ? "buy-now" : "remind-me",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FlashDealsPage;