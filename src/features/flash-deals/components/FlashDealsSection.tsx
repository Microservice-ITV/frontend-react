import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Flame } from "lucide-react";

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

const FlashDealsSection = () => {
  const [timeLeft, setTimeLeft] = useState(1 * 3600 + 55 * 60 + 29);
  const dealsTrackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

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

  return (
    <section className="relative w-full border border-gray-100 bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[var(--dni-primary)]">
            <Flame className="h-6 w-6 fill-[var(--dni-primary)]" />
            <span className="text-xl font-black uppercase tracking-[0.04em] text-[var(--dni-primary)]">
              Flash Deals
            </span>
          </div>

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
        </div>

        <Link
          to="/flash-deals"
          className="group inline-flex items-center gap-1 text-sm font-semibold text-[var(--dni-primary)]"
        >
          <span>See All</span>
          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="group relative">
        <div
          ref={dealsTrackRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto pb-1"
        >
          {FLASH_DEALS.map((deal) => (
            <div
              key={deal.id}
              data-deal-card
              className="w-[180px] min-w-[180px] snap-start border border-gray-100 bg-white shadow-[0_2px_0_rgba(17,24,39,0.02)] transition-all hover:border-emerald-200 hover:shadow-[0_4px_18px_rgba(17,24,39,0.06)] sm:w-[200px] sm:min-w-[200px]"
            >
              <div className="relative">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#fafafa]">
                  <img
                    src={deal.image}
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

                <div className="relative h-2.5 overflow-hidden bg-gray-100">
                  <div
                    className="h-full bg-[var(--dni-primary)]"
                    style={{ width: `${deal.soldPercent}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-1 text-[8px] font-bold text-white">
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
