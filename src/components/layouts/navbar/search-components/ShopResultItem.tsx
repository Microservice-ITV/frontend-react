import { Store } from "lucide-react";
import type { Shop } from "@/features/shops/types/shopTypes";

interface ShopResultItemProps {
  shop: Shop;
  onSelect: (shopId: string) => void;
}

const ShopResultItem = ({ shop, onSelect }: ShopResultItemProps) => {
  const domain = shop.domain ? String(shop.domain).trim() : "";
  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelect(shop.id)}
      className="flex items-center justify-between py-2.5 hover:bg-gray-50 rounded cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 bg-emerald-50 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center border border-emerald-100">
          <Store size={16} className="text-emerald-600" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {shop.name}
          </h4>
          {domain ? (
            <p className="text-xs text-gray-500 truncate">{domain}</p>
          ) : null}
        </div>
      </div>
      <div className="text-xs font-semibold text-gray-400 pl-3 flex-shrink-0">
        Shop
      </div>
    </div>
  );
};

export default ShopResultItem;

