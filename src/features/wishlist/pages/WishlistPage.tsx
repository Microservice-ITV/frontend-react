import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  selectWishlistCount,
  selectWishlistProductIds,
} from "../store/wishlistSelectors";
import { clearWishlist } from "../store/wishlistSlice";
import { wishlistApi } from "../api/wishlistApi";
import WishlistEmptyState from "../components/WishlistEmptyState";
import ProductGrid, {
  ProductGridSkeleton,
} from "@/features/products/components/ProductGrid";
import type {
  Product,
  ProductDetail,
} from "@/features/products/types/productTypes";

import { Heart, Trash2 } from "lucide-react";

const PRODUCTS_PER_PAGE = 20;

function detailToProduct(detail: ProductDetail): Product {
  return {
    id: detail.id,
    name: detail.name,
    price: Number(detail.price ?? detail.minPrice ?? 0),
    images: detail.images ?? [],
    categoryId: detail.categoryId,
  };
}

const WishlistPage = () => {
  const dispatch = useAppDispatch();
  const productIds = useAppSelector(selectWishlistProductIds);
  const count = useAppSelector(selectWishlistCount);
  const [currentPage, setCurrentPage] = useState(1);

  // Local cache keyed by product id so removals don't re-fetch the rest.
  const cacheRef = useRef<Record<string, Product>>({});
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "loading" | "succeeded" | "failed"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(
    1,
    Math.ceil(productIds.length / PRODUCTS_PER_PAGE),
  );
  const visibleProductIds = useMemo(
    () =>
      productIds.slice(
        (currentPage - 1) * PRODUCTS_PER_PAGE,
        currentPage * PRODUCTS_PER_PAGE,
      ),
    [currentPage, productIds],
  );

  const products = useMemo(
    () =>
      visibleProductIds
        .map((id) => cacheRef.current[id])
        .filter((p): p is Product => Boolean(p)),
    [version, visibleProductIds],
  );

  useEffect(() => {
    const missing = visibleProductIds.filter((id) => !cacheRef.current[id]);
    if (missing.length === 0) {
      if (visibleProductIds.length === 0) setStatus("idle");
      else setStatus("succeeded");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setError(null);

    wishlistApi
      .fetchProductDetails(missing)
      .then((details) => {
        if (cancelled) return;
        for (const detail of details) {
          cacheRef.current[detail.id] = detailToProduct(detail);
        }
        setVersion((v) => v + 1);
        setStatus("succeeded");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load wishlist products.",
        );
        setStatus("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [visibleProductIds]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  if (productIds.length === 0) {
    return <WishlistEmptyState />;
  }

  const isLoading =
    (status === "idle" || status === "loading") && products.length === 0;
  const hasError = status === "failed" && Boolean(error);
  const partiallyMissing =
    status === "succeeded" &&
    products.length > 0 &&
    products.length < visibleProductIds.length;

  return (
    <main className="min-h-[20rem] sm:min-h-[20rem] bg-[#f5f5f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
            <h1 className="text-lg font-semibold text-gray-900">My Wishlist</h1>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </div>

          {products.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch(clearWishlist())}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Clear all
            </button>
          )}
        </div>

        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {partiallyMissing && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-700 text-sm">
              Some items in your wishlist are no longer available.
            </p>
          </div>
        )}

        {isLoading ? (
          <ProductGridSkeleton count={Math.min(10, visibleProductIds.length)} />
        ) : products.length > 0 ? (
          <ProductGrid products={products} />
        ) : hasError ? (
          <div className="bg-white border border-red-200 p-6 text-center">
            <p className="text-sm text-red-600">
              Your wishlist is saved, but the product details could not be
              loaded.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Please refresh and try again.
            </p>
          </div>
        ) : null}

        {totalPages > 1 && (
          <nav
            className="flex items-center justify-center gap-3 pt-2"
            aria-label="Wishlist pages"
          >
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
              className="border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </main>
  );
};

export default WishlistPage;
