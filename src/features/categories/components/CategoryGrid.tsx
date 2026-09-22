import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Grid2X2 } from "lucide-react";
import type { Category } from "../types/categoryTypes";

interface Props {
  items: Category[];
}

export type CategoryGridHandle = {
  scrollLeft: () => void;
  scrollRight: () => void;
  hasOverflow: () => boolean;
};

/** Column width + gap — used for scroll distance */
const COL_WIDTH_PX = 130;
const GAP_PX = 4;
/** Scroll by ~half a “page” so previous columns stay partially visible */
const COLUMNS_PER_STEP = 5;

const CategoryImage = ({ src, alt }: { src?: string; alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const showFallback = failed || !src;

  return (
    <>
      {showFallback || !loaded ? (
        <Grid2X2 className="h-8 w-8 text-gray-300" aria-hidden />
      ) : null}

      {!showFallback ? (
        <img
          src={src}
          alt={alt}
          className={[
            "h-full w-full object-contain transition-transform duration-200 group-hover:scale-105",
            "transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(false);
          }}
        />
      ) : null}
    </>
  );
};

const CategoryGrid = forwardRef<CategoryGridHandle, Props>(({ items }, ref) => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const hasOverflow = () => {
    const el = scrollerRef.current;
    if (!el) return false;
    const epsilon = 2;
    return el.scrollWidth > el.clientWidth + epsilon;
  };

  const scrollByStep = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = (COL_WIDTH_PX + GAP_PX) * COLUMNS_PER_STEP;
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  useImperativeHandle(ref, () => ({
    scrollLeft: () => scrollByStep("left"),
    scrollRight: () => scrollByStep("right"),
    hasOverflow,
  }));

  return (
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
                <CategoryImage alt={cat.name} src={cat.image} />
              </div>
              <span className="text-sm font-medium text-gray-800 text-center line-clamp-2 leading-tight">
                {cat.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
});

CategoryGrid.displayName = "CategoryGrid";

export default CategoryGrid;
