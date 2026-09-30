import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { searchShops } from "@/features/shops/store/shopThunks";
import ShopSearchList from "@/features/shops/components/ShopSearchList";
import Pagination from "@/components/ui/Pagination";

const PAGE_SIZE = 10;

const ShopSearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const dispatch = useAppDispatch();
  const [currentPage, setCurrentPage] = useState(1);

  const shops = useAppSelector((s) => s.shops.searchResults || []);
  const status = useAppSelector((s) => s.shops.searchStatus || "idle");
  const error = useAppSelector((s) => s.shops.searchError || null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed) {
      void dispatch(searchShops({ query: trimmed, perPage: 100 }));
      setCurrentPage(1);
    }
  }, [dispatch, query]);

  const totalPages = Math.max(1, Math.ceil(shops.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedShops = useMemo(
    () => shops.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [shops, safePage],
  );
  const pageStart = shops.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safePage * PAGE_SIZE, shops.length);

  return (
    <div className="bg-[#f5f5f5] pt-4 pb-12 sm:pt-5">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex justify-between gap-3 sm:flex-row sm:items-center">
          <h1 className="text-lg font-semibold text-gray-800 sm:text-xl">
            Shop results for &ldquo;{query}&rdquo;
          </h1>
          <p className="inline-block rounded bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
            <span className="font-semibold text-emerald-600">{shops.length}</span>{" "}
            shop{shops.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {status === "loading" && (
          <div className="py-20 text-center text-sm font-medium text-gray-500">
            Searching shops...
          </div>
        )}

        {status === "failed" && (
          <div className="py-20 text-center text-sm font-medium text-red-500">
            {error || "Search failed. Please try again."}
          </div>
        )}

        {status === "succeeded" && shops.length === 0 && (
          <div className="py-20 text-center text-sm font-medium text-gray-500">
            No shops found matching &ldquo;{query}&rdquo;
          </div>
        )}

        {status === "succeeded" && shops.length > 0 && (
          <>
            <ShopSearchList shops={pagedShops} />
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <p className="text-xs text-slate-600">
                  Showing {pageStart}-{pageEnd} of {shops.length} shops
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
        )}
      </div>
    </div>
  );
};

export default ShopSearchResultsPage;
