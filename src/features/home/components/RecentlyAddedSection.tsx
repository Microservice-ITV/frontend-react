import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import ProductGrid from "@/features/products/components/ProductGrid";
import { fetchRecentProducts } from "@/features/products/store/productThunks";
import { ChevronRight } from "lucide-react";

const HOME_PREVIEW_COUNT = 10;

const RecentlyAddedSection = () => {
  const dispatch = useAppDispatch();
  const {
    recentProducts,
    recentProductsHasNextPage,
    recentProductsStatus,
    recentProductsError,
  } = useAppSelector((state) => state.products);

  useEffect(() => {
    if (recentProductsStatus === "idle") {
      void dispatch(fetchRecentProducts({}));
    }
  }, [dispatch, recentProductsStatus]);

  const previewProducts = recentProducts.slice(0, HOME_PREVIEW_COUNT);
  const showViewAll = recentProducts.length > 0 && (
    recentProductsHasNextPage || recentProducts.length > HOME_PREVIEW_COUNT
  );

  return (
    <section
      className="px-4 py-4 sm:px-6"
      aria-labelledby="recently-added-heading"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1
          id="recently-added-heading"
          className="text-base font-semibold uppercase text-gray-600"
        >
          Recently Added
        </h1>
        {showViewAll && (
          <Link
            to="/recently-added"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[var(--dni-primary)] hover:text-[var(--dni-primary-hover)] transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {recentProductsStatus === "loading" && recentProducts.length === 0 && (
        <div className="text-sm text-gray-500" role="status">
          Loading products...
        </div>
      )}

      {recentProductsError && (
        <div className="text-sm text-red-500" role="alert">
          Failed to load recently added products. Please try again later.
        </div>
      )}

      {recentProductsStatus === "succeeded" && recentProducts.length === 0 && (
        <div className="text-sm text-gray-500">
          No recently added products yet.
        </div>
      )}

      {previewProducts.length > 0 && (
        <ProductGrid products={previewProducts} showFindSimilar={false} />
      )}
    </section>
  );
};

export default RecentlyAddedSection;
