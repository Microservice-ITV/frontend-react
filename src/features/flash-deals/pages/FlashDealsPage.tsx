
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Flame,
  Zap,
  ArrowRight, Zap, ChevronRight
} from "lucide-react";
import { flashDealApi, type FlashDealsTimeSlotResponse, type FlashDealTimeSlotItem, type FlashDealTimeSlot, type FlashDealBySlotResponse } from "@/lib/api/flashDealClient";
import { productServiceAssetUrl } from "@/lib/api/apiConfig";
import FlashDealCard from "../components/FlashDealCard";


const pad = (value: number) => String(value).padStart(2, "0");

const FlashDealsPage = () => {
  const [activeCategory, setActiveCategory] = useState("Top Picks");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeSlotsData, setTimeSlotsData] = useState<FlashDealsTimeSlotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [filteredDeals, setFilteredDeals] = useState<FlashDealTimeSlotItem[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const endAtTargetRef = useRef<number | null>(null);
  const serverTimeOffsetRef = useRef(0);

  const syncServerTime = (serverTime: string, endAt?: string) => {
    serverTimeOffsetRef.current = Date.parse(serverTime) - Date.now();
    if (endAt) {
      endAtTargetRef.current = Date.parse(endAt);
      setTimeLeft(
        Math.max(0, Math.floor((endAtTargetRef.current + serverTimeOffsetRef.current - Date.now()) / 1000)),
      );
    }
  };

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const data = await flashDealApi.getFlashDealsByTimeSlot({ limit: 100 });
        setTimeSlotsData(data);
        if (data.timeSlots.length > 0) {
          setSelectedSlot(data.timeSlots[0].time);
        }
        if (data.items.length > 0) {
          syncServerTime(data.serverTime, data.items[0].endAt);
        }

        const dynamicCats = Array.from(
          new Set(
            data.items
              .map((item) => (item as any).categoryName ?? item.categorySlug ?? item.categoryId)
              .filter(Boolean)
          )
        ).map((raw) => {
          const id = String(raw);
          const name = id.includes('-') ? id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : id;
          return { id, name };
        });

        setCategories([{ id: "Top Picks", name: "Top Picks" }, ...dynamicCats]);
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
      setTimeLeft(
        Math.max(0, Math.floor((target + serverTimeOffsetRef.current - Date.now()) / 1000)),
      );
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

const FlashDealsPage = () => {
  const [activeCategory, setActiveCategory] = useState("Top Picks");
  const [timeLeft, setTimeLeft] = useState(() => {
    const end = getNextSessionEnd();
    return Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
  });
  const [now, setNow] = useState(() => new Date());

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
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedSlot) return;
    const fetchFiltered = async () => {
      setFilterLoading(true);
      try {
        const data = await flashDealApi.getFlashDealsBySlotAndCategory({
          slotTime: selectedSlot,
          categoryId: activeCategory !== "Top Picks" ? activeCategory : undefined,
          status: "all",
          limit: 50,
        });
        setFilteredDeals(data.items);
        if (data.items.length > 0) {
          syncServerTime(data.serverTime, data.items[0].endAt);
        }
      } catch (error) {
        console.error('Failed to fetch filtered deals:', error);
      } finally {
        setFilterLoading(false);
      }
    };
    fetchFiltered();
  }, [selectedSlot, activeCategory]);

  const hours = Math.floor((timeLeft ?? 0) / 3600);
  const minutes = Math.floor(((timeLeft ?? 0) % 3600) / 60);
  const seconds = (timeLeft ?? 0) % 60;

  // Which slot is live/next/upcoming, computed from the clock — no manual
  // isActive flag needed. The live slot (or, before the first drop, the
  // next one) is always rotated to the front of the array.
  const dealSlots = useMemo(() => {
    const todaySlotDates = DEAL_SLOTS.map((slot) =>
      parseSlotTime(slot.time, now),
    );

    let liveIndex = -1;
    for (let i = 0; i < todaySlotDates.length; i++) {
      if (todaySlotDates[i] <= now) liveIndex = i;
    }

    let nextIndex: number;
    let nextSlotDate: Date;

    if (liveIndex === -1) {
      nextIndex = 0;
      nextSlotDate = todaySlotDates[0];
    } else if (liveIndex + 1 < DEAL_SLOTS.length) {
      nextIndex = liveIndex + 1;
      nextSlotDate = todaySlotDates[nextIndex];
    } else {
      nextIndex = 0;
      nextSlotDate = new Date(todaySlotDates[0]);
      nextSlotDate.setDate(nextSlotDate.getDate() + 1);
    }

    const msUntilNext = nextSlotDate.getTime() - now.getTime();

    const withStatus = DEAL_SLOTS.map((slot, index) => {
      if (index === liveIndex) {
        return {
          ...slot,
          status: "live" as DealSlotStatus,
          countdown: `Ends in ${formatSlotCountdown(msUntilNext)}`,
        };
      }
      if (index === nextIndex) {
        return {
          ...slot,
          status: "next" as DealSlotStatus,
          countdown: `Starts in ${formatSlotCountdown(msUntilNext)}`,
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
  }, [now]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-900">
      <section className="border-[var(--dni-border)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-1.5 sm:px-6">
          <span className="hidden h-px w-10 bg-[#d1d5db] sm:block" />
          <div className="flex items-center gap-1.5 text-[var(--dni-primary)]">
            <Flame size={18} className="fill-[var(--dni-primary)]" />
            <span className="text-xl font-black uppercase tracking-tight text-[var(--dni-primary)]">
              FLASH DEALS
            </span>
          </div>
          <div className="ml-4 flex items-center gap-2 border-l border-[var(--dni-cart-border)] pl-4">
            {[pad(hours), pad(minutes), pad(seconds)].map((block, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <span className="flex h-10 min-w-[36px] items-center justify-center bg-[var(--dni-primary)] px-2 font-mono text-[13px] font-bold text-white">
                  {block}
                </span>
                {index < 2 && (
                  <span className="font-mono text-[13px] font-bold text-slate-700">
                    :
                  </span>
                )}
              </div>
            ))}
            <span className="ml-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Ends Soon
            </span>
          </div>
          <span className="hidden h-px w-10 bg-[#d1d5db] sm:block" />
        </div>
      </section>

      <section className="py-4 bg-[#ffffff]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-4 overflow-hidden border border-[#e5e7eb] bg-[#4b4f53]">
            {timeSlotsData?.timeSlots.map((slot: FlashDealTimeSlot, index: number) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => setSelectedSlot(slot.time)}
                className={`flex min-h-[64px] flex-col items-center justify-center px-3 py-2 text-center transition-colors ${
                  selectedSlot === slot.time
                    ? "bg-[var(--dni-primary)] text-white"
                    : "bg-[#4b4f53] text-white/85"
                } ${index > 0 ? "border-l border-white/10" : ""}`}
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
            {categories.map((cat) => (
              <button
                key={`cat-${cat.id}`}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`min-w-[150px] shrink-0 border-b-[3px] px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "border-[var(--dni-primary)] text-[var(--dni-primary)]"
                    : "border-transparent text-[#4b5563] hover:text-[#111827]"
                }`}
              >
                {cat.name}
              </button>
            ))}
            <button
              type="button"
              className="ml-auto inline-flex min-w-[110px] shrink-0 items-center justify-center gap-1 border-l border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#374151]"
            >
              More
              <ArrowRight size={14} className="text-[var(--dni-primary)]" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f5f5] px-4 pb-10 pt-3 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex min-w-0 flex-col overflow-hidden bg-white shadow-[0_1px_3px_rgba(17,24,39,0.04)] animate-pulse">
                <div className="aspect-square bg-slate-100" />
                <div className="flex min-h-[172px] flex-1 flex-col gap-2 p-3">
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-6 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded-full w-full" />
                  <div className="h-8 bg-slate-100 rounded w-24" />
                </div>
              </div>
            ))
          ) : filterLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex min-w-0 flex-col overflow-hidden bg-white shadow-[0_1px_3px_rgba(17,24,39,0.04)] animate-pulse">
                <div className="aspect-square bg-slate-100" />
                <div className="flex min-h-[172px] flex-1 flex-col gap-2 p-3">
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-6 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded-full w-full" />
                  <div className="h-8 bg-slate-100 rounded w-24" />
                </div>
              </div>
            ))
          ) : filteredDeals.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500">
              No deals found for this category and time slot.
            </div>
          ) : (
            filteredDeals.map((deal: FlashDealTimeSlotItem) => {
              const serverNow = Date.now() + serverTimeOffsetRef.current;
              const isOngoing =
                Date.parse(deal.startAt) <= serverNow && Date.parse(deal.endAt) >= serverNow;
              return (
                <div
                  key={deal.id}
                  className={`flex min-w-0 flex-col overflow-hidden bg-white shadow-[0_1px_3px_rgba(17,24,39,0.04)] ${deal.soldOut ? "opacity-90" : ""}`}
                >
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-white">
                    <div className="absolute left-0 top-2 z-10 bg-[var(--dni-primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Mall
                    </div>
                    <img
                      src={deal.image ? productServiceAssetUrl(deal.image) : ''}
                      alt={deal.name}
                      className="h-full w-full object-cover"
                    />
                    {deal.soldOut && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                        <span className="bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-[var(--dni-primary)]">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex min-h-[172px] flex-1 flex-col gap-2 p-3">
                    <p className="min-h-[2.75rem] text-[13px] font-medium leading-5 text-[#1f2937] line-clamp-2">
                      {deal.name}
                    </p>

                    <div className="flex items-center gap-1 text-[11px] text-[#9ca3af]">
                      <span className="line-through">
                        ${deal.originalPrice.toFixed(2)}
                      </span>
                      <span className="bg-[var(--dni-primary-soft)] px-1 text-[10px] font-bold text-[var(--dni-primary)]">
                        -{deal.discount}%
                      </span>
                    </div>

                    <div className="text-xl font-black leading-none text-[var(--dni-primary)]">
                      ${deal.dealPrice.toFixed(2)}
                    </div>

                    <div className="mt-auto flex items-center gap-2">
                      <div className="relative h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-[#f3f4f6]">
                        <div
                          className="h-full bg-[var(--dni-primary)]"
                          style={{ width: `${Math.min(100, deal.stockProgress)}%` }}
                        />
                        <span className="absolute inset-0 text-center text-[8px] font-bold leading-3 text-white">
                          {deal.stockText}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={!isOngoing || deal.soldOut}
                        className={`shrink-0 px-3 py-2 text-xs font-bold transition-opacity ${
                          isOngoing && !deal.soldOut
                            ? "bg-[var(--dni-primary)] text-white hover:opacity-95"
                            : "bg-slate-300 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        {deal.soldOut ? "Sold Out" : isOngoing ? "Buy Now" : "Remind Me"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-3 items-stretch">
          {filteredDeals.map((deal) => (
            <FlashDealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default FlashDealsPage;