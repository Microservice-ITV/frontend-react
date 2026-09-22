import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchCategories } from "@/features/categories/store/categoryThunks";
import {
  selectCategoriesStatus,
  selectCategoriesWithProducts,
} from "@/features/categories/store/categorySelectors";
import CategoryGrid, { type CategoryGridHandle } from "./CategoryGrid";

const CategoriesSection = () => {
  const dispatch = useAppDispatch();
  const categoriesWithProducts = useAppSelector(selectCategoriesWithProducts);
  const status = useAppSelector(selectCategoriesStatus);
  const gridRef = useRef<CategoryGridHandle>(null);
  const [showArrows, setShowArrows] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      void dispatch(fetchCategories());
    }
  }, [dispatch, status]);

  useEffect(() => {
    if (status !== "succeeded") {
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
  }, [status, categoriesWithProducts.length]);

  return (
    <section className="pt-6">
      <div className="mb-5 flex items-center justify-between px-4 sm:px-6">
        <h1 className="text-base uppercase font-semibold text-gray-600">
          Categories
        </h1>
        {status === "succeeded" && showArrows && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--dni-primary)] bg-white text-[var(--dni-primary)] transition-colors hover:bg-[var(--dni-primary)] hover:text-white cursor-pointer"
              onClick={() => gridRef.current?.scrollLeft()}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Scroll left</span>
            </button>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--dni-primary)] bg-white text-[var(--dni-primary)] transition-colors hover:bg-[var(--dni-primary)] hover:text-white cursor-pointer"
              onClick={() => gridRef.current?.scrollRight()}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Scroll right</span>
            </button>
          </div>
        )}
      </div>

      {status === "loading" && (
        <div className="text-sm text-gray-500">Loading categories...</div>
      )}

      {status === "failed" && (
        <div className="text-sm text-red-500">
          Failed to load categories. Please try again later.
        </div>
      )}

      {status === "succeeded" && (
        <CategoryGrid ref={gridRef} items={categoriesWithProducts} />
      )}
    </section>
  );
};

export default CategoriesSection;
