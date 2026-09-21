import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import FlashDealCard from "../components/FlashDealCard";

const DEAL_CATEGORIES = [
  "Top Picks",
  "12PM Snack & Save",
  "Mooncake",
  "Buy Today, Get Today",
  "Home Appliances",
];

const DEALS = [
  {
    id: 1,
    name: "Wireless Earbuds Pro",
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
    tag: "Electronics",
    price: 19.9,
    originalPrice: 59.9,
    discount: 67,
    stockText: "SELLING FAST",
    soldPercent: 78,
  },
  {
    id: 2,
    name: "Premium Ceramic Cookware Set",
    image:
      "https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=900&q=80",
    tag: "Home & Living",
    price: 45.5,
    originalPrice: 129,
    discount: 65,
    stockText: "SELLING FAST",
    soldPercent: 62,
  },
  {
    id: 3,
    name: "Hydrating Lip Tint Trio",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
    tag: "Beauty",
    price: 12.9,
    originalPrice: 32.9,
    discount: 61,
    stockText: "SELLING FAST",
    soldPercent: 88,
  },
  {
    id: 4,
    name: "Mini Robot Vacuum",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
    tag: "Electronics",
    price: 89,
    originalPrice: 199,
    discount: 55,
    stockText: "SELLING FAST",
    soldPercent: 45,
  },
  {
    id: 5,
    name: "Organic Baby Skincare Kit",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80",
    tag: "Mom & Baby",
    price: 24.9,
    originalPrice: 54.9,
    discount: 55,
    stockText: "LOW STOCK",
    soldPercent: 33,
  },
  {
    id: 6,
    name: "Athletic Running Shoes",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    tag: "Fashion",
    price: 36,
    originalPrice: 79.9,
    discount: 55,
    stockText: "SELLING FAST",
    soldPercent: 71,
  },
  {
    id: 7,
    name: "Portable Power Bank 20K",
    image:
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80",
    tag: "Electronics",
    price: 27.9,
    originalPrice: 59.9,
    discount: 53,
    stockText: "SELLING FAST",
    soldPercent: 91,
  },
  {
    id: 8,
    name: "Memory Foam Pillow Pair",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    tag: "Home & Living",
    price: 32.5,
    originalPrice: 68,
    discount: 52,
    stockText: "LOW STOCK",
    soldPercent: 28,
  },
];

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

const pad = (value: number) => String(value).padStart(2, "0");

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

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const filteredDeals = DEALS.filter(
    (deal) => activeCategory === "Top Picks" || deal.tag === activeCategory,
  );

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
            <Zap size={18} className="fill-current" />
            <span className="text-xl font-black uppercase tracking-tight">
              Flash
            </span>
            <span className="text-xl font-medium uppercase tracking-tight">
              Deals
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
            {DEAL_CATEGORIES.map((category) => (
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 sm:gap-4">
              {filteredDeals.map((deal) => (
                <FlashDealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FlashDealsPage;
