import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Flame,
  Zap,
} from "lucide-react";
import { flashDealApi, type FlashDealsTimeSlotResponse, type FlashDealTimeSlotItem, type FlashDealTimeSlot, type FlashDealBySlotResponse } from "@/lib/api/flashDealClient";
import { productServiceAssetUrl } from "@/lib/api/apiConfig";

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

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-900">
      <section className="border-b border-[var(--dni-border)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-1.5 sm:px-6">
          <span className="hidden h-px w-10 bg-[#d1d5db] sm:block" />
          <div className="flex items-center gap-1.5 text-[var(--dni-primary)]">
            <Flame size={18} className="fill-[var(--dni-primary)]" />
            <span className="text-xl font-black uppercase tracking-tight text-[var(--dni-primary)]">
              FLASH DEALS
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
            <Clock size={14} />
            <span className="hidden sm:inline">Ends in</span>
            <div className="flex items-center gap-1 text-white">
              {[hours, minutes, seconds].map((value, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className="min-w-[22px] rounded-sm bg-[#1f2937] px-1 py-0.5 text-center text-[11px] font-bold">
                    {pad(value)}
                  </span>
                  {index < 2 && <span className="text-[#1f2937]">:</span>}
                </div>
              ))}
            </div>
          </div>
          <span className="hidden h-px w-10 bg-[#d1d5db] sm:block" />
        </div>
      </section>

      <section className="bg-[#f3f3f3] py-0">
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
              >
                <span className="text-[17px] font-bold tracking-tight">
                  {slot.time}
                </span>
                <span className="mt-0.5 text-[11px] text-current/90">
                  {slot.label}
                </span>
              </button>
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
        </div>
      </section>
    </div>
  );
};

export default FlashDealsPage;