import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ResponsiveAssetImage from "@/components/media/ResponsiveAssetImage";
interface Props {
  images: string[];
}

const MAX_THUMBS_VISIBLE = 5;

const ProductGallery = ({ images }: Props) => {
  const safeImages = useMemo(
    () => (images.length ? images : ["/placeholder.svg"]),
    [images],
  );

  const imagesKey = useMemo(() => safeImages.join("|"), [safeImages]);

  const [activeIndex, setActiveIndex] = useState(0);
  const thumbRowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const activeSrc = safeImages[activeIndex] ?? safeImages[0];

  useEffect(() => {
    setActiveIndex(0);
  }, [imagesKey]);

  const updateScrollAffordance = useCallback(() => {
    const el = thumbRowRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(maxScroll > 2 && scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    const el = thumbRowRef.current;
    if (!el) return;
    updateScrollAffordance();
    el.addEventListener("scroll", updateScrollAffordance, { passive: true });
    const ro = new ResizeObserver(() => updateScrollAffordance());
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollAffordance);
      ro.disconnect();
    };
  }, [imagesKey, updateScrollAffordance]);

  const showThumbNav = safeImages.length > MAX_THUMBS_VISIBLE;

  const scrollThumbs = (direction: "left" | "right") => {
    const el = thumbRowRef.current;
    if (!el) return;
    // Scroll roughly one viewport of the strip (similar to Shopee paging)
    const amount = Math.max(el.clientWidth * 0.85, 160);
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const selectImage = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="w-full min-w-0 lg:w-[450px] lg:max-w-full flex-shrink-0">
      <ResponsiveAssetImage
        src={activeSrc}
        alt="Product"
        className="w-full h-auto max-h-[70vh] object-contain bg-white"
        variant="full"
        sizes="(max-width: 1024px) 100vw, 450px"
        loading="eager"
        fetchPriority="high"
      />

      <div className="relative mt-2">
        {showThumbNav && (
          <button
            type="button"
            aria-label="Previous thumbnails"
            disabled={!canScrollLeft}
            onClick={() => scrollThumbs("left")}
            className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-700 shadow-sm backdrop-blur-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        )}

        <div
          ref={thumbRowRef}
          className={`
                        flex gap-2 overflow-x-auto pb-2 scrollbar-hide
                        ${showThumbNav ? "px-10" : ""}
                    `}
        >
          {safeImages.map((img, index) => (
            <button
              key={`${imagesKey}-${index}`}
              type="button"
              data-thumb
              onClick={() => selectImage(index)}
              onMouseEnter={() => selectImage(index)}
              onFocus={() => selectImage(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={activeIndex === index ? "true" : undefined}
              className={`
                                relative flex-shrink-0 rounded border-2 bg-white p-0 transition
                                w-16 h-16 sm:w-20 sm:h-20
                                ${activeIndex === index ? "border-[var(--dni-primary)]" : "border-transparent hover:border-[var(--dni-primary)]/60"}
                                cursor-pointer overflow-hidden
                            `}
            >
              <ResponsiveAssetImage
                src={img}
                alt=""
                className="h-full w-full object-contain"
                variant="thumb"
                sizes="80px"
                loading="lazy"
              />
            </button>
          ))}
        </div>

        {showThumbNav && (
          <button
            type="button"
            aria-label="Next thumbnails"
            disabled={!canScrollRight}
            onClick={() => scrollThumbs("right")}
            className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-700 shadow-sm backdrop-blur-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductGallery;
