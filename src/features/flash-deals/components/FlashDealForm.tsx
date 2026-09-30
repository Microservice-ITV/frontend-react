import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, PackagePlus, Search, Trash2, X } from "lucide-react";

import { useAppSelector } from "@/app/hooks";
import { productServiceAssetUrl } from "@/lib/api/apiConfig";
import { flashDealAdminApi } from "../api/flashDealAdminApi";
import {
  type FlashDeal,
  type FlashDealItem,
  type FlashDealStatus,
  type ProductCatalogOption,
} from "../types/flashDealTypes";

export interface FlashDealFormValues {
  name: string;
  description: string;
  status: FlashDealStatus;
  /** Campaign date (YYYY-MM-DD). */
  campaignDate: string;
  /** Start time (HH:mm). */
  startTime: string;
  /** End time (HH:mm). */
  endTime: string;
  /** Computed from campaignDate + startTime; submitted as UTC ISO strings. */
  startAt: string;
  endAt: string;
}

export interface FlashDealItemRow {
  key: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productImage?: string | null;
  shopName?: string | null;
  originalPrice: number;
  dealPrice: number;
  allocatedQuantity: number;
  purchaseLimit: number;
  sortOrder: number;
}

interface FlashDealFormErrors {
  name?: string;
  campaignDate?: string;
  startTime?: string;
  endTime?: string;
  startAt?: string;
  endAt?: string;
  items?: string;
}

export interface FlashDealFormPayload {
  values: FlashDealFormValues;
  items: FlashDealItemRow[];
}

interface FlashDealFormProps {
  mode: "create" | "edit";
  initialValues: FlashDealFormValues;
  initialItems: FlashDealItemRow[];
  prefillItems?: FlashDealItemRow[];
  onSubmit: (payload: FlashDealFormPayload) => void;
  submitLabel: string;
  cancelTo: string;
  isSubmitting: boolean;
  submitError?: string | null;
  canEditItems?: boolean;
  currentStatus?: FlashDealStatus;
}

/** Local YYYY-MM-DD date part of an ISO timestamp (admin's own timezone). */
const localDatePart = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const buildSchedule = (
  campaignDate: string,
  startTime: string,
  endTime: string,
): { startAt: string; endAt: string } => {
  if (!campaignDate || !startTime || !endTime) return { startAt: "", endAt: "" };
  const start = new Date(`${campaignDate}T${startTime}:00`);
  const end = new Date(`${campaignDate}T${endTime}:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return { startAt: "", endAt: "" };
  if (end <= start) return { startAt: "", endAt: "" };
  return {
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  };
};

const formatScheduleTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const FlashDealForm = ({
  initialValues,
  initialItems,
  prefillItems,
  onSubmit,
  submitLabel,
  cancelTo,
  isSubmitting,
  submitError,
  canEditItems = true,
  currentStatus,
}: FlashDealFormProps) => {
  const authUser = useAppSelector((state) => state.auth.user);
  const [values, setValues] = useState<FlashDealFormValues>(initialValues);
  const [items, setItems] = useState<FlashDealItemRow[]>(initialItems);
  const [errors, setErrors] = useState<FlashDealFormErrors>({});

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductCatalogOption[]>(
    [],
  );
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const addedFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  const showAddedFeedback = (name: string) => {
    setAddedFeedback(name);
    if (addedFeedbackTimerRef.current) {
      clearTimeout(addedFeedbackTimerRef.current);
    }
    addedFeedbackTimerRef.current = setTimeout(() => {
      setAddedFeedback(null);
    }, 2500);
  };

  const isActiveLocked = currentStatus === "ACTIVE";

  const setField = <K extends keyof FlashDealFormValues>(
    key: K,
    value: FlashDealFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (prefillItems && prefillItems.length > 0) {
      setItems(prefillItems);
    }
  }, [prefillItems]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = addedFeedbackTimerRef.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const runSearch = async (query: string) => {
    if (searching) return;
    setSearching(true);
    try {
      const response = await flashDealAdminApi.searchProducts({
        search: query,
        limit: 12,
        shopId: authUser?.active_shop_id ?? undefined,
      });
      setSearchResults(response.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const searchOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: ProductCatalogOption[] = [];
    for (const product of searchResults) {
      if (!product.id) continue;
      if (items.some((item) => item.productId === product.id)) continue;
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      out.push(product);
    }
    return out;
  }, [searchResults, items]);

  const onScheduleChange = (campaignDate: string, startTime: string, endTime: string) => {
    setValues((prev) => {
      const next: FlashDealFormValues = {
        ...prev,
        campaignDate,
        startTime,
        endTime,
        startAt: "",
        endAt: "",
      };
      const computed = buildSchedule(campaignDate, startTime, endTime);
      if (computed.startAt) {
        next.startAt = computed.startAt;
        next.endAt = computed.endAt;
      }
      return next;
    });
    setErrors((prev) => ({
      ...prev,
      campaignDate: undefined,
      startTime: undefined,
      endTime: undefined,
      startAt: undefined,
      endAt: undefined,
    }));
  };

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
    setSearchOpen(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      void runSearch(query);
    }, 300);
  };

  const addProduct = (product: ProductCatalogOption) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const alreadyAdded = items.some((item) => item.productId === product.id);
    if (alreadyAdded) {
      setSearchOpen(false);
      setSearchQuery("");
      return;
    }
    const nextSort = items.length;
    setItems((prev) => [
      ...prev,
      {
        key: `${product.id}-${Date.now()}`,
        productId: product.id,
        variantId: null,
        productName: product.name,
        productImage: product.image,
        shopName: product.shopName ?? null,
        originalPrice: product.price,
        dealPrice: Math.round(Number(product.price) * 90) / 100,
        allocatedQuantity: 10,
        purchaseLimit: 1,
        sortOrder: nextSort,
      },
    ]);
    setSearchOpen(false);
    setSearchQuery("");
    setErrors((prev) => ({ ...prev, items: undefined }));
    showAddedFeedback(product.name);
    searchInputRef.current?.focus();
  };

  const updateItem = (key: string, patch: Partial<FlashDealItemRow>) => {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  };

  const removeItem = (key: string) => {
    setItems((prev) =>
      prev
        .filter((item) => item.key !== key)
        .map((item, index) => ({ ...item, sortOrder: index })),
    );
  };

  const discountPercent = (item: FlashDealItemRow): number => {
    const original = Number(item.originalPrice);
    const deal = Number(item.dealPrice);
    if (
      !Number.isFinite(original) ||
      !Number.isFinite(deal) ||
      original <= 0
    ) {
      return 0;
    }
    return Math.max(0, Math.round(((original - deal) / original) * 100));
  };

  const allDiscount = useMemo(() => {
    if (items.length === 0) return 0;
    const totalOriginal = items.reduce(
      (sum, item) => sum + Number(item.originalPrice),
      0,
    );
    if (!Number.isFinite(totalOriginal) || totalOriginal <= 0) return 0;
    const totalDeal = items.reduce(
      (sum, item) => sum + Number(item.dealPrice),
      0,
    );
    return Math.max(
      0,
      Math.round(((totalOriginal - totalDeal) / totalOriginal) * 100),
    );
  }, [items]);

  const handleSubmit = () => {
    const nextErrors: FlashDealFormErrors = {};

    if (!values.name.trim()) nextErrors.name = "Deal name is required.";
    if (!values.campaignDate.trim()) {
      nextErrors.campaignDate = "Select a campaign date.";
    }
    if (!values.startTime.trim()) nextErrors.startTime = "Select a start time.";
    if (!values.endTime.trim()) nextErrors.endTime = "Select an end time.";

    const computed = buildSchedule(values.campaignDate, values.startTime, values.endTime);
    if (!computed.startAt) {
      nextErrors.startAt = "Start time could not be computed from the selected date and time.";
    }
    if (!computed.endAt) {
      nextErrors.endAt = "End time could not be computed from the selected date and time.";
    } else if (computed.startAt && new Date(computed.endAt) <= new Date(computed.startAt)) {
      nextErrors.endAt = "End time must be after start time.";
    }

    const activeItems = items.filter((item) => item.productId);
    if (activeItems.length === 0) {
      nextErrors.items = "Add at least one product to the deal.";
    }

    for (const item of activeItems) {
      if (item.originalPrice <= 0) {
        item.originalPrice = item.dealPrice;
      }
      if (item.dealPrice >= item.originalPrice) {
        nextErrors.items =
          "Deal price must be lower than the original price for every item.";
        break;
      }
      if (item.dealPrice <= 0) {
        nextErrors.items =
          "Deal price must be greater than zero for every item.";
        break;
      }
      if (item.allocatedQuantity < 1) {
        nextErrors.items =
          "Allocated quantity must be at least 1 for every item.";
        break;
      }
      if (
        item.purchaseLimit < 1 ||
        item.purchaseLimit > item.allocatedQuantity
      ) {
        nextErrors.items =
          "Purchase limit must be between 1 and the allocated quantity.";
        break;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      values: {
        ...values,
        startAt: computed.startAt,
        endAt: computed.endAt,
      },
      items: activeItems,
    });
  };

  const disabled = isSubmitting;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--dni-border)] bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Campaign Metadata
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Configure the deal name and schedule.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Flash Deal Name
              </label>
              <input
                type="text"
                value={values.name}
                disabled={disabled}
                onChange={(e) => {
                  setField("name", e.target.value);
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g. Daily Flash Deal 10:30"
                className="w-full rounded-lg border border-[var(--dni-border)] px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--dni-primary)] disabled:bg-slate-50 disabled:text-slate-400"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Campaign Date
              </label>
              <input
                type="date"
                value={values.campaignDate}
                disabled={disabled}
                onChange={(e) =>
                  onScheduleChange(e.target.value, values.startTime, values.endTime)
                }
                className="w-full rounded-lg border border-[var(--dni-border)] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--dni-primary)] disabled:bg-slate-50 disabled:text-slate-400"
              />
              {errors.campaignDate && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.campaignDate}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Start Time
                </label>
                <input
                  type="time"
                  value={values.startTime}
                  disabled={disabled}
                  onChange={(e) =>
                    onScheduleChange(values.campaignDate, e.target.value, values.endTime)
                  }
                  className="w-full rounded-lg border border-[var(--dni-border)] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--dni-primary)] disabled:bg-slate-50 disabled:text-slate-400"
                />
                {errors.startTime && (
                  <p className="mt-1 text-xs text-red-600">{errors.startTime}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  End Time
                </label>
                <input
                  type="time"
                  value={values.endTime}
                  disabled={disabled}
                  onChange={(e) =>
                    onScheduleChange(values.campaignDate, values.startTime, e.target.value)
                  }
                  className="w-full rounded-lg border border-[var(--dni-border)] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--dni-primary)] disabled:bg-slate-50 disabled:text-slate-400"
                />
                {errors.endTime && (
                  <p className="mt-1 text-xs text-red-600">{errors.endTime}</p>
                )}
              </div>
            </div>

            {values.startAt && values.endAt && (
              <div className="rounded-lg border border-[var(--dni-primary-200)] bg-[var(--dni-primary-50)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--dni-primary-700)]">
                  Schedule Preview
                </p>
                <p className="mt-1.5 text-sm text-slate-700">
                  Starts {formatScheduleTime(values.startAt)}
                </p>
                <p className="text-sm text-slate-700">
                  Ends {formatScheduleTime(values.endAt)}
                </p>
              </div>
            )}

            {errors.startAt && (
              <p className="text-xs text-red-600">{errors.startAt}</p>
            )}
            {errors.endAt && (
              <p className="text-xs text-red-600">{errors.endAt}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--dni-border)] bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Flash Deal Items
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Pick products and set a discounted deal price.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {items.length} Products Selected
              </span>
              {items.length > 0 && (
                <span className="inline-flex min-w-[44px] items-center justify-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  {allDiscount > 0 ? `-${allDiscount}%` : "0%"}
                </span>
              )}
            </div>
          </div>

          {!canEditItems && isActiveLocked ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-amber-700">
                Items cannot be modified while the deal is ACTIVE. Use the list
                to pause or cancel the deal first if you need to change
                products.
              </p>
            </div>
          ) : (
            <div ref={pickerRef} className="relative z-50 mt-5">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  disabled={disabled}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search products to add..."
                  className="w-full rounded-lg border border-[var(--dni-border)] bg-white py-2 pl-9 pr-8 text-sm outline-none placeholder:text-slate-400 focus:border-[var(--dni-primary)] disabled:bg-slate-50 disabled:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      if (searchTimerRef.current) {
                        clearTimeout(searchTimerRef.current);
                      }
                      setSearchQuery("");
                      setSearchOpen(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {searchOpen && (
                <div className="absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-[var(--dni-border)] bg-white shadow-lg">
                  {searching ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-500">
                      <Loader2 size={14} className="animate-spin" />
                      Searching products...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-slate-500">
                      No products found.
                    </p>
                  ) : searchOptions.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-slate-500">
                      All matching products are already added.
                    </p>
                  ) : (
                    searchOptions.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => addProduct(product)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                          {product.image ? (
                            <img
                              src={productServiceAssetUrl(product.image)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <PackagePlus size={15} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-slate-900">
                            {product.name}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            Shop: {product.shopName ?? "—"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            $
                            {Number(product.price).toFixed(2)}
                            {Number.isFinite(product.stock)
                              ? ` · In Stock: ${product.stock}`
                              : ""}
                            {product.categoryName
                              ? ` · ${product.categoryName}`
                              : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-[var(--dni-primary)]">
                          + Add
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {addedFeedback && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              <Check size={13} />
              {addedFeedback} added to deal
            </div>
          )}

          <div className="mt-4">
            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--dni-border)] p-6 text-center">
                <PackagePlus size={20} className="mx-auto text-slate-300" />
                <p className="mt-2 text-xs text-slate-500">
                  No products added yet. Search for a product to start building
                  the deal.
                </p>
              </div>
            ) : (
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--dni-border)] text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="w-[35%] pb-2 pr-3 font-semibold">
                      Product & Shop
                    </th>
                    <th className="w-[15%] pb-2 pr-3 text-right font-semibold">
                      Original Price
                    </th>
                    <th className="w-[20%] pb-2 pr-3 text-right font-semibold">
                      Deal Price
                    </th>
                    <th className="w-[15%] pb-2 pr-3 text-right font-semibold">
                      Allocated
                    </th>
                    <th className="w-[10%] pb-2 pr-3 text-right font-semibold">
                      Limit / User
                    </th>
                    <th className="w-[5%] pb-2 text-right font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const discount = discountPercent(item);
                    return (
                      <tr
                        key={item.key}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-2.5 pr-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                              {item.productImage ? (
                                <img
                                  src={productServiceAssetUrl(
                                    item.productImage,
                                  )}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <PackagePlus
                                  size={15}
                                  className="text-slate-400"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="min-w-0 truncate font-medium text-slate-900">
                                {item.productName}
                              </p>
                              {item.shopName && (
                                <p className="truncate text-[11px] text-slate-500">
                                  {item.shopName}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-right">
                          <span className="text-xs text-slate-500">
                            {Number(item.originalPrice).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0.01}
                              step="0.01"
                              disabled={disabled || !canEditItems}
                              value={item.dealPrice}
                              onChange={(e) =>
                                updateItem(item.key, {
                                  dealPrice: Number(e.target.value),
                                })
                              }
                              className="w-full min-w-0 flex-1 rounded border border-[var(--dni-primary-200)] bg-white px-1.5 py-1.5 text-right text-xs font-semibold text-[var(--dni-primary-700)] outline-none focus:border-[var(--dni-primary)] disabled:bg-slate-100 disabled:text-slate-400"
                            />
                            <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              {discount}% OFF
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-right">
                          <input
                            type="number"
                            min={1}
                            disabled={disabled || !canEditItems}
                            value={item.allocatedQuantity}
                            onChange={(e) =>
                              updateItem(item.key, {
                                allocatedQuantity: Number(e.target.value),
                              })
                            }
                            className="w-full min-w-0 rounded border border-[var(--dni-border)] bg-white px-1.5 py-1.5 text-right text-xs text-slate-900 outline-none focus:border-[var(--dni-primary)] disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </td>
                        <td className="py-2.5 pr-3 text-right">
                          <input
                            type="number"
                            min={1}
                            disabled={disabled || !canEditItems}
                            value={item.purchaseLimit}
                            onChange={(e) =>
                              updateItem(item.key, {
                                purchaseLimit: Number(e.target.value),
                              })
                            }
                            className="w-full min-w-0 rounded border border-[var(--dni-border)] bg-white px-1.5 py-1.5 text-right text-xs text-slate-900 outline-none focus:border-[var(--dni-primary)] disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            disabled={disabled || !canEditItems}
                            onClick={() => removeItem(item.key)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {errors.items && (
              <p className="mt-2 text-xs text-red-600">{errors.items}</p>
            )}
          </div>
        </div>
      </div>

      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link
          to={cancelTo}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--dni-border)] bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--dni-primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--dni-primary-hover)] disabled:cursor-not-allowed disabled:bg-[var(--dni-primary-300)] cursor-pointer"
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
};

const localTimePart = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const flashDealInitialValues = (
  deal?: FlashDeal | null,
): FlashDealFormValues => {
  const campaignDate = deal?.startAt ? localDatePart(deal.startAt) : "";
  const startTime = deal?.startAt ? localTimePart(deal.startAt) : "";
  const endTime = deal?.endAt ? localTimePart(deal.endAt) : "";
  const computed = buildSchedule(campaignDate, startTime, endTime);
  return {
    name: deal?.name ?? "",
    description: deal?.description ?? "",
    status: deal?.status ?? "DRAFT",
    campaignDate,
    startTime,
    endTime,
    startAt: computed.startAt,
    endAt: computed.endAt,
  };
};

export const flashDealInitialItems = (
  deal?: FlashDeal | null,
): FlashDealItemRow[] =>
  (deal?.items ?? []).map((item: FlashDealItem) => ({
    key: item.id,
    productId: item.productId,
    variantId: item.variantId,
    productName: item.product?.name ?? "Unknown product",
    productImage: item.product?.images?.[0] ?? null,
    shopName: item.product?.shopName ?? null,
    originalPrice: Number(item.originalPrice),
    dealPrice: Number(item.dealPrice),
    allocatedQuantity: item.allocatedQuantity,
    purchaseLimit: item.purchaseLimit,
    sortOrder: item.sortOrder,
  }));

export default FlashDealForm;
