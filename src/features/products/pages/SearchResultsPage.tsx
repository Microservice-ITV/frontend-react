import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { searchProducts } from "@/features/products/store/productThunks";
import { searchShops } from "@/features/shops/store/shopThunks";
import { fetchCategories } from "@/features/categories/store/categoryThunks";
import {
  selectCategories,
  selectCategoriesStatus,
} from "@/features/categories/store/categorySelectors";
import ProductGrid from "../components/ProductGrid";
import ProductSortBar from "../components/ProductSortBar";
import Pagination from "@/components/ui/Pagination";
import {
  normalizeProductSort,
  type ProductSortKey,
} from "../utils/productSort";
import ShopSearchList from "@/features/shops/components/ShopSearchList";

const PAGE_SIZE = 10;

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const dispatch = useAppDispatch();
  const [sort, setSort] = useState<ProductSortKey>(() =>
    normalizeProductSort(searchParams.get("sort")),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [shopPage, setShopPage] = useState(1);

  const searchResults = useAppSelector((s) => s.products.searchResults || []);
  const searchStatus = useAppSelector((s) => s.products.searchStatus || "idle");
  const searchError = useAppSelector((s) => s.products.searchError || null);
  const shops = useAppSelector((s) => s.shops.searchResults || []);
  const shopStatus = useAppSelector((s) => s.shops.searchStatus || "idle");
  const shopError = useAppSelector((s) => s.shops.searchError || null);
  const categories = useAppSelector(selectCategories);
  const categoriesStatus = useAppSelector(selectCategoriesStatus);
  const categorySlug = searchParams.get("category") ?? "";

  useEffect(() => {
    const nextSort = normalizeProductSort(searchParams.get("sort"));
    setSort(nextSort);
  }, [searchParams]);

  useEffect(() => {
    if (categoriesStatus === "idle") {
      void dispatch(fetchCategories());
    }
  }, [categoriesStatus, dispatch]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    const slug = categorySlug.trim();
    if (!trimmedQuery && !slug) return;
    if (slug && (categoriesStatus === "idle" || categoriesStatus === "loading")) {
      return;
    }

    const categoryId = slug
      ? categories.find((category) => category.slug === slug)?.id
      : undefined;

    void dispatch(
      searchProducts({
        query: trimmedQuery,
        sort,
        categoryId,
      }),
    );
    setCurrentPage(1);
    setShopPage(1);
    if (trimmedQuery) {
      void dispatch(searchShops({ query: trimmedQuery, perPage: 100 }));
    }
  }, [dispatch, query, sort, categorySlug, categories, categoriesStatus]);

  const handleSortChange = (nextSort: ProductSortKey) => {
    setSort(nextSort);
    setCurrentPage(1);
    const next = new URLSearchParams(searchParams);
    next.set("sort", nextSort);
    setSearchParams(next, { replace: true });
  };

  const totalPages = Math.max(1, Math.ceil(searchResults.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedProducts = useMemo(
    () =>
      searchResults.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [searchResults, safePage],
  );
  const pageStart =
    searchResults.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safePage * PAGE_SIZE, searchResults.length);

  const shopTotalPages = Math.max(1, Math.ceil(shops.length / PAGE_SIZE));
  const safeShopPage = Math.min(shopPage, shopTotalPages);
  const pagedShops = useMemo(
    () => shops.slice((safeShopPage - 1) * PAGE_SIZE, safeShopPage * PAGE_SIZE),
    [shops, safeShopPage],
  );
  const shopPageStart = shops.length === 0 ? 0 : (safeShopPage - 1) * PAGE_SIZE + 1;
  const shopPageEnd = Math.min(safeShopPage * PAGE_SIZE, shops.length);

  const bothEmpty =
    searchStatus === "succeeded" &&
    shopStatus === "succeeded" &&
    searchResults.length === 0 &&
    shops.length === 0;
  const bothFailed = searchStatus === "failed" && shopStatus === "failed";

  return (
    <div className="bg-[#f5f5f5] pt-4 sm:pt-5 pb-12">
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
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Shops
            </h2>
            <ShopSearchList shops={pagedShops} />
            {shopTotalPages > 1 && (
              <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <p className="text-xs text-slate-600">
                  Showing {shopPageStart}-{shopPageEnd} of {shops.length} shops
                </p>
                <Pagination
                  page={safeShopPage}
                  totalPages={shopTotalPages}
                  onPageChange={setShopPage}
                  className="justify-center sm:justify-end"
                />
              </div>
            )}
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
              <ProductGrid products={pagedProducts} />
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <p className="text-xs text-slate-600">
                  Showing {pageStart}-{pageEnd} of {searchResults.length} products
                </p>
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  className="justify-center sm:justify-end"
                />
              </div>
            )}
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
