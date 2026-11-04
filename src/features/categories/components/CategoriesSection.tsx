import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CategoryGrid, { type CategoryGridHandle } from "./CategoryGrid";
import { useReportHomeSection } from "@/features/home/homeScreenReady";
import { useHomeCategoriesQuery } from "@/features/home/queries/homeQueries";
import { Typing } from "@/components/loading-ui/typing";
import { StorefrontUnavailableNotice } from "@/components/feedback/StorefrontUnavailableNotice";

const CategoriesSection = () => {
  const { data: categories = [], isPending, isError, isFetched, isSuccess } =
    useHomeCategoriesQuery();
  const categoriesWithProducts = useMemo(
    () => categories.filter((c) => (c._count?.products ?? 0) > 0),
    [categories],
  );
  const gridRef = useRef<CategoryGridHandle>(null);
  const [showArrows, setShowArrows] = useState(false);
  useReportHomeSection("categories", isFetched);

  useEffect(() => {
    if (!isSuccess) {
      setShowArrows(false);
      return;
    }

    const update = () => {
      setShowArrows(Boolean(gridRef.current?.hasOverflow()));
    };

    update();
    const t = window.setTimeout(update, 0);
    window.addEventListener("resize", update);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", update);
    };
  }, [isSuccess, categoriesWithProducts.length]);

  return (
    <section className="pt-6">
      <div className="mb-5 flex min-h-7 items-center justify-between px-4 sm:px-6">
        <h1 className="text-base uppercase font-semibold text-gray-600">
          Shop by Category
        </h1>
        <div
          className={`flex items-center gap-1 ${showArrows ? "visible" : "invisible"}`}
          aria-hidden={!showArrows}
        >
          <button
            type="button"
            disabled={!showArrows}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--dni-primary)] bg-white text-[var(--dni-primary)] transition-colors hover:bg-[var(--dni-primary)] hover:text-white cursor-pointer disabled:pointer-events-none"
            onClick={() => gridRef.current?.scrollLeft()}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Scroll left</span>
          </button>
          <button
            type="button"
            disabled={!showArrows}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--dni-primary)] bg-white text-[var(--dni-primary)] transition-colors hover:bg-[var(--dni-primary)] hover:text-white cursor-pointer disabled:pointer-events-none"
            onClick={() => gridRef.current?.scrollRight()}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Scroll right</span>
          </button>
        </div>
      </div>

      {isPending && (
        <div className="flex min-h-[180px] items-center justify-center">
          <Typing className="w-8" />
        </div>
      )}

      {isError && (
        <StorefrontUnavailableNotice className="min-h-[180px]" />
      )}

      {isSuccess && (
        <div className="min-h-[180px]">
          <CategoryGrid ref={gridRef} items={categoriesWithProducts} />
        </div>
      )}
    </section>
  );
};

export default CategoriesSection;
