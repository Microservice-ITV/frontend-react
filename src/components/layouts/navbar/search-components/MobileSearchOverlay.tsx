import { type RefObject } from "react";
import { ArrowLeft, X } from "lucide-react";
import type { Product } from "@/features/products/types/productTypes";
import type { Category } from "@/features/categories/types/categoryTypes";
import type { Shop } from "@/features/shops/types/shopTypes";
import CategoryChips from "./CategoryChips";
import SearchResultItem from "./SearchResultItem";
import ShopResultItem from "./ShopResultItem";
import { MIN_QUERY_LENGTH } from "./useNavbarSearch";
import productNotFoundImg from "@/assets/announcement/productnotfound.png";

interface MobileSearchOverlayProps {
  searchQuery: string;
  categories: Category[];
  selectedCategoryId: string;
  searchResults: Product[];
  searchStatus: "idle" | "loading" | "succeeded" | "failed";
  shopResults: Shop[];
  shopStatus: "idle" | "loading" | "succeeded" | "failed";
  inputRef: RefObject<HTMLInputElement>;
  onClose: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onSearch: () => void;
  onCategorySelect: (categoryId: string) => void;
  onSelectProduct: (productId: string) => void;
  onSelectShop: (shopId: string) => void;
}

const MobileSearchOverlay = ({
  searchQuery,
  categories,
  selectedCategoryId,
  searchResults,
  searchStatus,
  shopResults,
  shopStatus,
  inputRef,
  onClose,
  onChange,
  onKeyDown,
  onClear,
  onSearch,
  onCategorySelect,
  onSelectProduct,
  onSelectShop,
}: MobileSearchOverlayProps) => {
  const query = searchQuery.trim();
  const productsLoading = searchStatus === "loading" && searchResults.length === 0;
  const shopsLoading = shopStatus === "loading" && shopResults.length === 0;
  const bothEmpty =
    searchStatus === "succeeded" &&
    shopStatus === "succeeded" &&
    searchResults.length === 0 &&
    shopResults.length === 0;

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col md:hidden">
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-gray-600 hover:text-gray-900 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center flex-1 border border-gray-300 rounded-sm overflow-hidden focus-within:border-emerald-500 bg-white px-3 py-1.5">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder="Search products, shops and more"
            className="w-full text-sm outline-none bg-transparent"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="px-1 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="bg-emerald-600 px-3 py-2 text-white rounded-sm text-sm font-medium"
        >
          Search
        </button>
      </div>

      <CategoryChips
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={onCategorySelect}
      />

      <div className="flex-1 flex flex-col min-h-0 bg-[#f5f5f5]">
        {query.length >= MIN_QUERY_LENGTH ? (
          <div className="flex-1 flex flex-col bg-white shadow-sm min-h-0 overflow-y-auto">
            {(shopsLoading || shopResults.length > 0) && (
              <div>
                <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Shops ({shopResults.length})
                  </h3>
                </div>
                <div className="px-4 divide-y divide-gray-100">
                  {shopsLoading && (
                    <div className="py-12 text-center text-sm text-gray-500">
                      Searching shops...
                    </div>
                  )}
                  {shopResults.map((shop) => (
                    <ShopResultItem
                      key={shop.id}
                      shop={shop}
                      onSelect={onSelectShop}
                    />
                  ))}
                </div>
              </div>
            )}

            {(productsLoading || searchResults.length > 0) && (
              <div>
                <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Products ({searchResults.length})
                  </h3>
                </div>
                <div className="px-4 divide-y divide-gray-100">
                  {productsLoading && (
                    <div className="py-12 text-center text-sm text-gray-500">
                      Searching products...
                    </div>
                  )}
                  {searchResults.map((product) => (
                    <SearchResultItem
                      key={product.id}
                      product={product}
                      onSelect={onSelectProduct}
                      size="md"
                    />
                  ))}
                </div>
              </div>
            )}

            {bothEmpty && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <img
                  src={productNotFoundImg}
                  alt="No results found"
                  className="w-32 h-32 object-contain mb-3"
                />
                <p className="text-sm text-gray-500">
                  No products or shops found matching &ldquo;{query}&rdquo;
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-gray-400">
            Type at least {MIN_QUERY_LENGTH} characters to search
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSearchOverlay;
