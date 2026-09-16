import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgePercent,
  Clock,
  Flame,
  Megaphone,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
} from "lucide-react";

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
    dealPrice: 19.9,
    originalPrice: 59.9,
    discount: 67,
    sold: "2.4k",
    gradient: "from-[var(--dni-primary-50)] to-white",
    stockText: "SELLING FAST",
    stockProgress: 78,
  },
  {
    id: 2,
    name: "Premium Ceramic Cookware Set",
    image:
      "https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=900&q=80",
    tag: "Home & Living",
    dealPrice: 45.5,
    originalPrice: 129,
    discount: 65,
    sold: "1.8k",
    gradient: "from-[var(--dni-primary-100)] to-white",
    stockText: "SELLING FAST",
    stockProgress: 62,
  },
  {
    id: 3,
    name: "Hydrating Lip Tint Trio",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
    tag: "Beauty",
    dealPrice: 12.9,
    originalPrice: 32.9,
    discount: 61,
    sold: "3.1k",
    gradient: "from-[#fff1f2] to-white",
    stockText: "SELLING FAST",
    stockProgress: 88,
  },
  {
    id: 4,
    name: "Mini Robot Vacuum",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
    tag: "Electronics",
    dealPrice: 89,
    originalPrice: 199,
    discount: 55,
    sold: "962",
    gradient: "from-[#f5f3ff] to-white",
    stockText: "SELLING FAST",
    stockProgress: 45,
  },
  {
    id: 5,
    name: "Organic Baby Skincare Kit",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80",
    tag: "Mom & Baby",
    dealPrice: 24.9,
    originalPrice: 54.9,
    discount: 55,
    sold: "1.2k",
    gradient: "from-[var(--dni-primary-50)] to-white",
    stockText: "LOW STOCK",
    stockProgress: 33,
  },
  {
    id: 6,
    name: "Athletic Running Shoes",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    tag: "Fashion",
    dealPrice: 36,
    originalPrice: 79.9,
    discount: 55,
    sold: "2.7k",
    gradient: "from-[#f5f5f5] to-white",
    stockText: "SELLING FAST",
    stockProgress: 71,
  },
  {
    id: 7,
    name: "Portable Power Bank 20K",
    image:
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80",
    tag: "Electronics",
    dealPrice: 27.9,
    originalPrice: 59.9,
    discount: 53,
    sold: "4.5k",
    gradient: "from-[#f3f4f6] to-white",
    stockText: "SELLING FAST",
    stockProgress: 91,
  },
  {
    id: 8,
    name: "Memory Foam Pillow Pair",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    tag: "Home & Living",
    dealPrice: 32.5,
    originalPrice: 68,
    discount: 52,
    sold: "1.6k",
    gradient: "from-[#f3f4f6] to-white",
    stockText: "LOW STOCK",
    stockProgress: 28,
  },
];

const SESSION_TIMES = [
  { time: "10:30", label: "Ongoing", isActive: true },
  { time: "12:30", label: "Coming Soon", isActive: false },
  { time: "16:30", label: "Coming Soon", isActive: false },
  { time: "18:30", label: "Coming Soon", isActive: false },
];

const getNextSessionEnd = () => {
  const end = new Date();
  end.setMinutes(0, 0, 0);
  end.setHours(end.getHours() + 1);
  return end;
};

const pad = (value: number) => String(value).padStart(2, "0");

const FlashDealsPage = () => {
  const [activeCategory, setActiveCategory] = useState("Top Picks");
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

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const filteredDeals = DEALS.filter(
    (deal) => activeCategory === "Top Picks" || deal.tag === activeCategory,
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-900">
      <section className="border-b border-[var(--dni-border)] bg-white">
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
            {SESSION_TIMES.map((slot, index) => (
              <button
                key={slot.time}
                type="button"
                className={`flex min-h-[64px] flex-col items-center justify-center px-3 py-2 text-center transition-colors ${
                  slot.isActive
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
          {filteredDeals.map((deal) => (
            <div
              key={deal.id}
              className="flex min-w-0 flex-col overflow-hidden bg-white shadow-[0_1px_3px_rgba(17,24,39,0.04)]"
            >
              <div
                className={`relative aspect-square overflow-hidden bg-gradient-to-br ${deal.gradient}`}
              >
                <div className="absolute left-0 top-2 z-10 bg-[var(--dni-primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Mall
                </div>
                <img
                  src={deal.image}
                  alt={deal.name}
                  className="h-full w-full object-cover"
                />
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
                      style={{ width: `${deal.stockProgress}%` }}
                    />
                    <span className="absolute inset-0 text-center text-[8px] font-bold leading-3 text-white">
                      {deal.stockText}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 bg-[var(--dni-primary)] px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-95"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FlashDealsPage;
