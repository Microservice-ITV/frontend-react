import { Link } from "react-router-dom";
import ProductGrid from "@/features/products/components/ProductGrid";
import { ChevronRight } from "lucide-react";
import { useReportHomeSection } from "@/features/home/homeScreenReady";
import { useHomeRecentProductsQuery } from "@/features/home/queries/useHomeRecentProductsQuery";
import { Typing } from "@/components/loading-ui/typing";
import { StorefrontUnavailableNotice } from "@/components/feedback/StorefrontUnavailableNotice";

const HOME_PREVIEW_COUNT = 10;

const RecentlyAddedSection = () => {
  const { data, isPending, isError, isFetched, isSuccess } =
    useHomeRecentProductsQuery(HOME_PREVIEW_COUNT);
  useReportHomeSection("recentlyAdded", isFetched);

  const recentProducts = data?.items ?? [];
  const recentProductsHasNextPage = data?.hasNextPage ?? false;
  const previewProducts = recentProducts.slice(0, HOME_PREVIEW_COUNT);
  const showViewAll =
    recentProducts.length > 0 &&
    (recentProductsHasNextPage || recentProducts.length > HOME_PREVIEW_COUNT);

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

      {isPending && recentProducts.length === 0 && (
        <div className="flex min-h-40 items-center justify-center" role="status">
          <Typing className="w-8" />
        </div>
      )}

      {isError && <StorefrontUnavailableNotice className="py-4" />}

      {isSuccess && recentProducts.length === 0 && (
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
