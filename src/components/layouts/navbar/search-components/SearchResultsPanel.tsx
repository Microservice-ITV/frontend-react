import type { Product } from "@/features/products/types/productTypes";
import type { Category } from "@/features/categories/types/categoryTypes";
import SearchResultItem from "./SearchResultItem";

interface SearchResultsPanelProps {
  searchQuery: string;
  searchResults: Product[];
  searchStatus: "idle" | "loading" | "succeeded" | "failed";
  selectedCategory: Category | undefined;
  onSelectProduct: (productId: string) => void;
  onSeeAll: (query: string) => void;
}

const SearchResultsPanel = ({
  searchQuery,
  searchResults,
  searchStatus,
  selectedCategory,
  onSelectProduct,
  onSeeAll,
}: SearchResultsPanelProps) => {
  return (
    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 flex flex-col max-h-96">
      <div className="flex-shrink-0 bg-white z-10 px-4 pt-3 pb-2 border-b border-gray-100">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {selectedCategory ? `In ${selectedCategory.name} ` : ""}
          Products ({searchResults.length})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 divide-y divide-gray-50">
        {searchStatus === "loading" && searchResults.length === 0 && (
          <div className="py-6 text-center text-xs text-gray-500">
            Searching products...
          </div>
        )}

        {searchStatus === "succeeded" && searchResults.length === 0 && (
          <div className="py-6 text-center text-xs text-gray-500">
            No products found.
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

      {searchResults.length > 0 && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSeeAll(searchQuery)}
          className="flex-shrink-0 border-t border-gray-100 p-3 bg-gray-50/50 text-sm text-gray-500 hover:bg-gray-100 cursor-pointer text-center"
        >
          Press <span className="font-medium text-emerald-600">Enter</span> to
          see all results for &apos;{searchQuery}&apos;
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
