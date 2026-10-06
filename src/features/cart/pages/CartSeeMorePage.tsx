import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  fetchRelatedProducts,
  fetchBroughtTogetherProducts,
} from "@/features/products/store/recommendationsSlice";
import {
  selectRecommendationsStatus,
  selectRecommendationsError,
} from "@/features/products/store/recommendationsSlice";
import {
  selectRelatedProducts,
  selectBroughtTogetherProducts,
} from "@/features/products/store/recommendationsSlice";
import {
  selectCartProductKey,
} from "@/features/cart/store/cartSelectors";
import ProductGrid, {
  ProductGridSkeleton,
} from "@/features/products/components/ProductGrid";
import Pagination from "@/components/ui/Pagination";

const DESCRIPTION =
  "Products often bought with the items in your cart, shown at their regular prices.";

const SeeMoreHeading = ({ className }: { className: string }) => (
  <div className="mb-6">
    <h1 className={className}>You May Also Like</h1>
    <p className="mt-1 text-sm text-gray-600">{DESCRIPTION}</p>
  </div>
);

const CartSeeMorePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const cartProductKey = useAppSelector(selectCartProductKey);
  const cartProductIds = useMemo(
    () => (cartProductKey ? cartProductKey.split(",") : []),
    [cartProductKey],
  );

  const relatedProducts = useAppSelector(selectRelatedProducts);
  const broughtTogetherProducts = useAppSelector(selectBroughtTogetherProducts);
  const status = useAppSelector(selectRecommendationsStatus);
  const error = useAppSelector(selectRecommendationsError);

  useEffect(() => {
    if (cartProductIds.length > 0) {
      dispatch(fetchRelatedProducts(cartProductIds));
      dispatch(fetchBroughtTogetherProducts(cartProductIds));
    }
  }, [dispatch, cartProductKey]);

  const excludeIds = useMemo(() => new Set(cartProductIds), [cartProductIds]);

  // Rank co-purchased (brought-together) products first, then related ones,
  // and exclude any product already in the cart
  const allProducts = useMemo(() => {
    const merged = [...broughtTogetherProducts, ...relatedProducts];
    const seen = new Set<string>();
    return merged.filter((product) => {
      if (
        product.id == null ||
        seen.has(product.id) ||
        excludeIds.has(product.id)
      ) {
        return false;
      }
      seen.add(product.id);
      return true;
    });
  }, [relatedProducts, broughtTogetherProducts, excludeIds]);

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(allProducts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedProducts = useMemo(
    () => allProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [allProducts, safePage],
  );
  const pageStart =
    allProducts.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safePage * PAGE_SIZE, allProducts.length);

  if (cartProductIds.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-bold mb-4">Product Recommendations</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Your cart is empty.</p>
          </div>
        </div>
      </div>
    );
  }

  const isInitialLoading = status === "loading" && allProducts.length === 0;
  const hasError = status === "failed" && error && allProducts.length === 0;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SeeMoreHeading className="text-base uppercase font-semibold text-gray-600" />
          <ProductGridSkeleton count={10} />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SeeMoreHeading className="text-base uppercase font-semibold text-gray-600" />
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">
              Unable to load recommendations. Please try again later.
            </p>
          </div>
          <button
            onClick={() => navigate("/cart")}
            className="inline-flex items-center px-4 py-2 border border-[var(--dni-primary)] text-[var(--dni-primary)] 
                                 rounded-lg hover:bg-[var(--dni-primary)] hover:text-white transition-colors"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SeeMoreHeading className="text-2xl font-semibold text-gray-900" />

        {allProducts.length > 0 ? (
          <>
            <ProductGrid products={pagedProducts} />

            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <p className="text-xs text-slate-600">
                  Showing {pageStart}-{pageEnd} of {allProducts.length} products
                </p>
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  className="justify-center sm:justify-end"
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              No recommendations available at the moment.
            </p>
            <button
              onClick={() => navigate("/cart")}
              className="inline-flex items-center px-4 py-2 border border-[var(--dni-primary)] text-[var(--dni-primary)] 
                                     rounded-lg hover:bg-[var(--dni-primary)] hover:text-white transition-colors"
            >
              Back to Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSeeMorePage;
