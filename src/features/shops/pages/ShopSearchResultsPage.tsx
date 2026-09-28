import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { searchShops } from "@/features/shops/store/shopThunks";

const ShopSearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const shops = useAppSelector((s) => s.shops.searchResults || []);
  const status = useAppSelector((s) => s.shops.searchStatus || "idle");
  const error = useAppSelector((s) => s.shops.searchError || null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed) {
      dispatch(searchShops({ query: trimmed, perPage: 50 }));
    }
  }, [dispatch, query]);

  return (
    <div className="bg-[#f5f5f5] min-h-screen pt-4 sm:pt-5 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-6 flex sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
            Shop results for &ldquo;{query}&rdquo;
          </h1>
          <p className="text-sm text-gray-500 bg-white px-3 py-2 rounded shadow-sm inline-block">
            <span className="font-semibold text-emerald-600">{shops.length}</span>{" "}
            shop{shops.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {status === "loading" && (
          <div className="py-20 text-center text-sm text-gray-500 font-medium">
            Searching shops...
          </div>
        )}

        {status === "failed" && (
          <div className="py-20 text-center text-sm text-red-500 font-medium">
            {error || "Search failed. Please try again."}
          </div>
        )}

        {status === "succeeded" && shops.length === 0 && (
          <div className="py-20 text-center text-sm text-gray-500 font-medium">
            No shops found matching &ldquo;{query}&rdquo;
          </div>
        )}

        {status === "succeeded" && shops.length > 0 && (
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
        )}
      </div>
    </div>
  );
};

export default ShopSearchResultsPage;

