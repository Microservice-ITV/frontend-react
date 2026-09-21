import { useEffect, useState } from "react";
import { PackagePlus } from "lucide-react";

import { productServiceAssetUrl } from "@/lib/api/apiConfig";
import type { FlashDeal } from "../types/flashDealTypes";

export interface StockTopUpDraft {
  [itemId: string]: number;
}

interface StockTopUpModalContentProps {
  deal: FlashDeal;
  onDraftChange: (draft: StockTopUpDraft) => void;
}

const StockTopUpModal = ({
  deal,
  onDraftChange,
}: StockTopUpModalContentProps) => {
  const [allocated, setAllocated] = useState<StockTopUpDraft>(() =>
    Object.fromEntries(
      deal.items.map((item) => [item.id, item.allocatedQuantity]),
    ),
  );

  useEffect(() => {
    onDraftChange(allocated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocated]);

  if (deal.items.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        This flash deal has no items yet. Add items from the edit screen before
        topping up stock.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Increase the allocated quantity for the items below. Sold quantities are
        shown for reference and cannot be edited.
      </p>

      <div className="overflow-hidden rounded-lg border border-[var(--dni-border)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--dni-border)] bg-white">
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                Product
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                Sold
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                Allocated
              </th>
            </tr>
          </thead>
          <tbody>
            {deal.items.map((item) => {
              const value =
                typeof allocated[item.id] === "number"
                  ? allocated[item.id]
                  : item.allocatedQuantity;
              return (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                        {item.product.images?.[0] ? (
                          <img
                            src={productServiceAssetUrl(item.product.images[0])}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <PackagePlus size={16} className="text-slate-400" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-900">
                        {item.product.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-slate-600">
                      {item.soldQuantity}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={item.soldQuantity}
                      value={value}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        if (Number.isNaN(next)) return;
                        setAllocated((prev) => ({ ...prev, [item.id]: next }));
                      }}
                      className="w-24 rounded border border-[var(--dni-border)] px-2 py-1 text-xs text-slate-900 outline-none focus:border-[var(--dni-primary)]"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockTopUpModal;
