import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Category } from "../types/categoryTypes";

interface Props {
  items: Category[];
}

/** Column width + gap — used for scroll distance */
const COL_WIDTH_PX = 130;
const GAP_PX = 4;
/** Scroll by ~half a “page” so previous columns stay partially visible */
const COLUMNS_PER_STEP = 5;

const CategoryGrid = ({ items }: Props) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

    // Recheck after images/layout settle
    const t = window.setTimeout(updateScrollAffordance, 100);

    return () => {
      el.removeEventListener("scroll", updateScrollAffordance);
      el.removeEventListener("scrollend", updateScrollAffordance);
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [items, updateScrollAffordance]);

  const scrollByStep = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = (COL_WIDTH_PX + GAP_PX) * COLUMNS_PER_STEP;
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          aria-label="Previous categories"
          onClick={() => scrollByStep("left")}
          className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition duration-200 hover:scale-150 hover:bg-gray-50 cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
      )}

      <div
        ref={scrollerRef}
        className="overflow-x-auto overflow-y-hidden scrollbar-hide"
      >
        <ul
          className="grid w-full min-w-max grid-flow-col grid-rows-1"
          style={{ gridAutoColumns: `minmax(${COL_WIDTH_PX}px, 1fr)` }}
        >
          {items.map((cat) => (
            <li key={cat.id} className="h-full min-w-0">
              <Link
                to={`/categories/${cat.id}`}
                className="
                  group flex h-full flex-col items-center px-3 py-5 bg-white border
                  border-gray-100 transition-all duration-200 hover:border-emerald-200 hover:shadow-md
                  focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div className="mb-3 flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-full bg-[#fafafa] transition-colors duration-200 group-hover:bg-emerald-50">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-400">No Image</span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-800 text-center line-clamp-2 leading-tight">
                  {cat.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {canScrollRight && (
        <button
          type="button"
          aria-label="Next categories"
          onClick={() => scrollByStep("right")}
          className="absolute right-0 top-1/2 z-10 flex h-8 w-8 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition duration-200 hover:scale-150 hover:bg-gray-50 cursor-pointer"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      )}
    </div>
  );
};

export default CategoryGrid;
