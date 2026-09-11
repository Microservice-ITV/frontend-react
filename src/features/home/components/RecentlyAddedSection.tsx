import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import ProductGrid from "@/features/products/components/ProductGrid";
import { fetchRecentProducts } from "@/features/products/store/productThunks";

const RecentlyAddedSection = () => {
  const dispatch = useAppDispatch();
  const {
    recentProducts,
    recentProductsNextCursor,
    recentProductsHasNextPage,
    recentProductsLoading,
    recentProductsStatus,
    recentProductsError,
  } = useAppSelector((state) => state.products);

  useEffect(() => {
    if (recentProductsStatus === "idle") {
      void dispatch(fetchRecentProducts({}));
    }
  }, [dispatch, recentProductsStatus]);

  return (
    <section className="pt-4" aria-labelledby="recently-added-heading">
      <h1 className="mb-5 px-4 sm:px-6 text-base uppercase font-semibold text-gray-600">
        Recently Added
      </h1>

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

      {recentProducts.length > 0 && (
        <>
          <div className="px-4 sm:px-6">
            <ProductGrid products={recentProducts} showFindSimilar={false} />
          </div>

          {recentProductsHasNextPage && recentProductsNextCursor && (
            <div className="mt-5 text-center">
              <button
                type="button"
                className="dni-btn"
                onClick={() =>
                  void dispatch(
                    fetchRecentProducts({ cursor: recentProductsNextCursor }),
                  )
                }
                disabled={recentProductsLoading}
              >
                {recentProductsLoading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default RecentlyAddedSection;
