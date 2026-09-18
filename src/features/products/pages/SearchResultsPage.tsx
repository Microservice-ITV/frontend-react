import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { searchProducts } from "@/features/products/store/productThunks";
import ProductGrid from "../components/ProductGrid";
import ProductSortBar from "../components/ProductSortBar";
import {
  normalizeProductSort,
  type ProductSortKey,
} from "../utils/productSort";

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const dispatch = useAppDispatch();
  const [sort, setSort] = useState<ProductSortKey>(() =>
    normalizeProductSort(searchParams.get("sort")),
  );

  const searchResults = useAppSelector((s) => s.products.searchResults || []);
  const searchStatus = useAppSelector((s) => s.products.searchStatus || "idle");
  const searchError = useAppSelector((s) => s.products.searchError || null);

  useEffect(() => {
    const nextSort = normalizeProductSort(searchParams.get("sort"));
    setSort(nextSort);
  }, [searchParams]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      dispatch(searchProducts({ query: trimmedQuery, sort }));
    }
  }, [dispatch, query, sort]);

  const handleSortChange = (nextSort: ProductSortKey) => {
    setSort(nextSort);
    const next = new URLSearchParams(searchParams);
    next.set("sort", nextSort);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen pt-4 sm:pt-5 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-6 flex sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
            Search results for &ldquo;{query}&rdquo;
          </h1>
          <p className="text-sm text-gray-500 bg-white px-3 py-2 rounded shadow-sm inline-block">
            <span className="font-semibold text-emerald-600">
              {searchResults.length}
            </span>{" "}
            product{searchResults.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <ProductSortBar sort={sort} onSortChange={handleSortChange} />

        {searchStatus === "loading" && (
          <div className="py-20 text-center text-sm text-gray-500 font-medium">
            Searching products...
          </div>
        )}

        {searchStatus === "failed" && (
          <div className="py-20 text-center text-sm text-red-500 font-medium">
            {searchError || "Search failed. Please try again."}
          </div>
        )}

        {searchStatus === "succeeded" && searchResults.length === 0 && (
          <div className="py-20 text-center text-sm text-gray-500 font-medium">
            No products found matching &ldquo;{query}&rdquo;
          </div>
        )}

        {searchStatus === "succeeded" && searchResults.length > 0 && (
          <div className="mt-4">
            <ProductGrid products={searchResults} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
