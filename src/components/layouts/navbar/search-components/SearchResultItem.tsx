import { Search } from "lucide-react";
import type { Product } from "@/features/products/types/productTypes";
import { formatKsPrice } from "@/features/products/utils/formatProductPrice";

interface SearchResultItemProps {
  product: Product;
  onSelect: (productId: string) => void;
  size?: "sm" | "md";
}

const SearchResultItem = ({
  product,
  onSelect,
  size = "sm",
}: SearchResultItemProps) => {
  const imgSize = size === "sm" ? "w-11 h-11" : "w-12 h-12";
  const padding = size === "sm" ? "py-2.5" : "py-3";

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelect(product.id)}
      className={`flex items-center justify-between ${padding} hover:bg-gray-50 rounded cursor-pointer transition-colors`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`${imgSize} bg-gray-100 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-200`}
        >
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Search size={16} className="text-gray-400" />
          )}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {product.name}
          </h4>
          {product.tags?.[0] && (
            <p className="text-xs text-gray-500 truncate">{product.tags[0]}</p>
          )}
        </div>
      </div>
      <div className="text-sm font-semibold text-emerald-600 pl-3 flex-shrink-0">
        {formatKsPrice(product.price)}
      </div>
    </div>
  );
};

export default SearchResultItem;
