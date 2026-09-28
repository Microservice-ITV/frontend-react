import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { searchProducts } from "@/features/products/store/productThunks";
import { searchShops } from "@/features/shops/store/shopThunks";
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
  const navigate = useNavigate();
  const [sort, setSort] = useState<ProductSortKey>(() =>
    normalizeProductSort(searchParams.get("sort")),
  );

  const searchResults = useAppSelector((s) => s.products.searchResults || []);
  const searchStatus = useAppSelector((s) => s.products.searchStatus || "idle");
  const searchError = useAppSelector((s) => s.products.searchError || null);
  const shops = useAppSelector((s) => s.shops.searchResults || []);
  const shopStatus = useAppSelector((s) => s.shops.searchStatus || "idle");
  const shopError = useAppSelector((s) => s.shops.searchError || null);

  useEffect(() => {
    const nextSort = normalizeProductSort(searchParams.get("sort"));
    setSort(nextSort);
  }, [searchParams]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      dispatch(searchProducts({ query: trimmedQuery, sort }));
      dispatch(searchShops({ query: trimmedQuery, perPage: 50 }));
    }
  }, [dispatch, query, sort]);

  const handleSortChange = (nextSort: ProductSortKey) => {
    setSort(nextSort);
    const next = new URLSearchParams(searchParams);
    next.set("sort", nextSort);
    setSearchParams(next, { replace: true });
  };

  const bothEmpty =
    searchStatus === "succeeded" &&
    shopStatus === "succeeded" &&
    searchResults.length === 0 &&
    shops.length === 0;
  const bothFailed = searchStatus === "failed" && shopStatus === "failed";

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
            product{searchResults.length !== 1 ? "s" : ""}
            {" · "}
            <span className="font-semibold text-emerald-600">{shops.length}</span>{" "}
            shop{shops.length !== 1 ? "s" : ""}
          </p>
        </div>

        {shops.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Shops
            </h2>
            <div className="bg-white border border-gray-200 rounded shadow-sm divide-y divide-gray-100">
              {shops.map((shop) => (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => navigate(`/shops/${shop.id}`)}
                  className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {shop.name}
                      </p>
                      {shop.domain ? (
                        <p className="text-xs sm:text-sm text-gray-500 truncate mt-1">
                          {shop.domain}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-xs font-semibold text-gray-400">
                      Shop
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {shopStatus === "loading" && shops.length === 0 && (
          <p className="mb-6 text-sm text-gray-500">Searching shops...</p>
        )}

        {shopStatus === "failed" && shops.length === 0 && !bothFailed && (
          <p className="mb-6 text-sm text-red-500">
            {shopError || "Shop search failed. Please try again."}
          </p>
        )}

        {searchResults.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Products
            </h2>
            <ProductSortBar sort={sort} onSortChange={handleSortChange} />
            <div className="mt-4">
              <ProductGrid products={searchResults} />
            </div>
          </section>
        )}

        {searchStatus === "loading" && searchResults.length === 0 && (
          <div className="py-20 text-center text-sm text-gray-500 font-medium">
            Searching products...
          </div>
        )}

        {searchStatus === "failed" && searchResults.length === 0 && !bothFailed && (
          <div className="py-20 text-center text-sm text-red-500 font-medium">
            {searchError || "Search failed. Please try again."}
          </div>
        )}

        {bothFailed && (
          <div className="py-20 text-center text-sm text-red-500 font-medium">
            Search failed. Please try again.
          </div>
        )}

        {bothEmpty && (
          <div className="py-20 text-center text-sm text-gray-500 font-medium">
            No products or shops found matching &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
