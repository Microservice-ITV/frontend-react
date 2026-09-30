import type { Product } from "@/features/products/types/productTypes";
import type { Category } from "@/features/categories/types/categoryTypes";
import type { Shop } from "@/features/shops/types/shopTypes";
import SearchResultItem from "./SearchResultItem";
import ShopResultItem from "./ShopResultItem";

interface SearchResultsPanelProps {
  searchQuery: string;
  searchResults: Product[];
  searchStatus: "idle" | "loading" | "succeeded" | "failed";
  shopResults: Shop[];
  shopStatus: "idle" | "loading" | "succeeded" | "failed";
  selectedCategory: Category | undefined;
  onSelectProduct: (productId: string) => void;
  onSelectShop: (shopId: string) => void;
  onSeeAll: (query: string) => void;
}

const SearchResultsPanel = ({
  searchQuery,
  searchResults,
  searchStatus,
  shopResults,
  shopStatus,
  selectedCategory,
  onSelectProduct,
  onSelectShop,
  onSeeAll,
}: SearchResultsPanelProps) => {
  const query = searchQuery.trim();
  const productsLoading = searchStatus === "loading" && searchResults.length === 0;
  const shopsLoading = shopStatus === "loading" && shopResults.length === 0;
  const productsEmpty = searchStatus === "succeeded" && searchResults.length === 0;
  const shopsEmpty = shopStatus === "succeeded" && shopResults.length === 0;
  const bothEmpty = productsEmpty && shopsEmpty;

  return (
    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 flex flex-col max-h-96">
      <div className="flex-1 overflow-y-auto">
        {(shopsLoading || shopResults.length > 0) && (
          <div>
            <div className="sticky top-0 bg-white z-10 px-4 pt-3 pb-2 border-b border-gray-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Shops ({shopResults.length})
              </h3>
            </div>
            <div className="px-4 divide-y divide-gray-50">
              {shopsLoading && (
                <div className="py-6 text-center text-xs text-gray-500">
                  Searching shops...
                </div>
              )}
              {shopResults.map((shop) => (
                <ShopResultItem key={shop.id} shop={shop} onSelect={onSelectShop} />
              ))}
            </div>
          </div>
        )}

        {(productsLoading || searchResults.length > 0) && (
          <div>
            <div className="sticky top-0 bg-white z-10 px-4 pt-3 pb-2 border-b border-gray-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {selectedCategory ? `In ${selectedCategory.name} ` : ""}
                Products ({searchResults.length})
              </h3>
            </div>
            <div className="px-4 divide-y divide-gray-50">
              {productsLoading && (
                <div className="py-6 text-center text-xs text-gray-500">
                  Searching products...
                </div>
              )}
              {searchResults.map((product) => (
                <SearchResultItem
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                />
              ))}
            </div>
          </div>
        )}

        {bothEmpty && (
          <div className="py-6 text-center text-xs text-gray-500">
            No products or shops found.
          </div>
        )}
      </div>

      {(searchResults.length > 0 || shopResults.length > 0) && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSeeAll(query)}
          className="flex-shrink-0 border-t border-gray-100 p-3 bg-gray-50/50 text-sm text-gray-500 hover:bg-gray-100 cursor-pointer text-center"
        >
          Press <span className="font-medium text-emerald-600">Enter</span> to
          see all results for &apos;{query}&apos;
          {selectedCategory ? (
            <>
              {" "}
              in <span className="font-medium">{selectedCategory.name}</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchResultsPanel;
