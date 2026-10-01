import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Check, Loader2, PackagePlus, Search, Trash2, X } from "lucide-react";

import { useAppSelector } from "@/app/hooks";
import { productServiceAssetUrl } from "@/lib/api/apiConfig";
import { flashDealAdminApi } from "../api/flashDealAdminApi";
import { useFlashDealPaths } from "../config/flashDealPaths";
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
  // An end time at or before the start time belongs to the following day, so
  // manual slots such as 22:00 -> 02:00 are valid instead of being rejected.
  if (end <= start) end.setDate(end.getDate() + 1);
  return {
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  };
};

const crossesMidnight = (startTime: string, endTime: string): boolean => {
  if (!startTime || !endTime) return false;
  return endTime <= startTime;
};

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.NaN;
  return hours * 60 + minutes;
};

const buildDurationLabel = (
  campaignDate: string,
  startTime: string,
  endTime: string,
): string => {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  if (!campaignDate || !Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) return "";

  const totalMinutes = crossesMidnight(startTime, endTime)
    ? endMinutes + 24 * 60 - startMinutes
    : endMinutes - startMinutes;
  if (totalMinutes <= 0) return "";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  return parts.length > 0 ? parts.join(" ") : "";
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

const SEARCH_DROPDOWN_MAX_HEIGHT = 320;
const SEARCH_DROPDOWN_GAP = 4;
const SEARCH_DROPDOWN_VIEWPORT_MARGIN = 8;
/** Two result cards per row, so the panel is widened past the input's own width. */
const SEARCH_DROPDOWN_MIN_WIDTH = 520;
const SEARCH_DROPDOWN_TWO_COLUMN_MIN_WIDTH = 380;

type SearchDropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

const resolveSearchDropdownPosition = (
  anchor: HTMLDivElement,
): SearchDropdownPosition => {
  const rect = anchor.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - SEARCH_DROPDOWN_GAP;
  const flipUp = spaceBelow < SEARCH_DROPDOWN_MAX_HEIGHT / 2 && rect.top > spaceBelow;
  const maxHeight = Math.max(
    96,
    Math.min(
      SEARCH_DROPDOWN_MAX_HEIGHT,
      flipUp ? rect.top - SEARCH_DROPDOWN_GAP : spaceBelow,
    ),
  );
  const available = window.innerWidth - SEARCH_DROPDOWN_VIEWPORT_MARGIN * 2;
  const width = Math.min(Math.max(rect.width, SEARCH_DROPDOWN_MIN_WIDTH), available);

  return {
    top: flipUp
      ? Math.max(SEARCH_DROPDOWN_VIEWPORT_MARGIN, rect.top - maxHeight - SEARCH_DROPDOWN_GAP)
      : rect.bottom + SEARCH_DROPDOWN_GAP,
    left: Math.max(
      SEARCH_DROPDOWN_VIEWPORT_MARGIN,
      Math.min(rect.left, window.innerWidth - width - SEARCH_DROPDOWN_VIEWPORT_MARGIN),
    ),
    width,
    maxHeight,
  };
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
  const { area } = useFlashDealPaths();
  const isSellerArea = area === "seller";
  /**
   * Sellers must only ever see their own catalog. Without an active shop the
   * request would be unscoped and product-service would happily return every
   * approved shop's products, so the search is blocked instead.
   */
  const shopScopeId = isSellerArea ? authUser?.active_shop_id ?? null : null;
  const missingShopScope = isSellerArea && !shopScopeId;
  const searchScopeError = missingShopScope
    ? "Your account is not linked to a shop yet, so there are no products to search. Open your shop settings first."
    : null;
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
  const searchSeqRef = useRef(0);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchAnchorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchDropdownPosition, setSearchDropdownPosition] =
    useState<SearchDropdownPosition | null>(null);
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
  const isItemPickerLocked = !canEditItems && isActiveLocked;

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
      const target = e.target as Node;
      // The results list is rendered in a portal on document.body, so it is
      // never inside pickerRef. Without this the mousedown would close the
      // dropdown before the click landed and the product would never be added.
      const isInsidePicker = pickerRef.current?.contains(target) ?? false;
      const isInsideDropdown = dropdownRef.current?.contains(target) ?? false;
      if (!isInsidePicker && !isInsideDropdown) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchOpen) {
      setSearchDropdownPosition(null);
      return;
    }

    const syncPosition = () => {
      const anchor = searchAnchorRef.current;
      if (!anchor) return;
      setSearchDropdownPosition(resolveSearchDropdownPosition(anchor));
    };

    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);
    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [searchOpen, searchResults, searching]);

  useEffect(() => {
    const timer = addedFeedbackTimerRef.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const runSearch = async (query: string) => {
    // Requests are debounced, but a slow response for an older query must not
    // overwrite the results of the query the user actually typed.
    const seq = ++searchSeqRef.current;
    setSearching(true);
    try {
      const response = await flashDealAdminApi.searchProducts({
        search: query.trim() || undefined,
        limit: 24,
        shopId: shopScopeId ?? undefined,
      });
      if (seq !== searchSeqRef.current) return;
      setSearchResults(response.data);
    } catch {
      if (seq !== searchSeqRef.current) return;
      setSearchResults([]);
    } finally {
      if (seq === searchSeqRef.current) setSearching(false);
    }
  };

  /** Explicit trigger: the Search button and Enter both go through here. */
  const submitSearch = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (missingShopScope) {
      setSearchResults([]);
      setSearchOpen(true);
      setSearchDropdownPosition(
        searchAnchorRef.current
          ? resolveSearchDropdownPosition(searchAnchorRef.current)
          : null,
      );
      return;
    }
    void runSearch(searchQuery);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    submitSearch();
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

  const durationLabel = useMemo(
    () =>
      buildDurationLabel(values.campaignDate, values.startTime, values.endTime),
    [values.campaignDate, values.startTime, values.endTime],
  );

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
    } else if (computed.startAt && new Date(computed.endAt).getTime() <= new Date(computed.startAt).getTime()) {
      nextErrors.endAt = "End time must be after start time.";
    } else if (computed.endAt && new Date(computed.endAt).getTime() <= Date.now()) {
      // The storefront only serves deals inside their window, so a window that
      // already elapsed would be published but never rendered.
      nextErrors.endAt =
        "This time window has already passed. Pick a future date or time so the deal can go live.";
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
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700">
                  Start Time
                </label>
                <span className="text-[11px] text-slate-500">
                  {durationLabel && `Runs for ${durationLabel}`}
                </span>
              </div>
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

          <p className="text-[11px] leading-relaxed text-slate-500">
            Any time of day can be picked. An end time at or before the start
            time is treated as the next day, so 22:00 &rarr; 02:00 works.
          </p>

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

          {isItemPickerLocked ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-amber-700">
                Items cannot be modified while the deal is ACTIVE. Use the list
                to pause or cancel the deal first if you need to change
                products.
              </p>
            </div>
          ) : (
            <div ref={pickerRef} className="relative mt-5">
              <div ref={searchAnchorRef} className="flex items-stretch gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    disabled={disabled}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    onKeyDown={onSearchKeyDown}
                    placeholder="Search your products by name..."
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
                        setSearchResults([]);
                        setSearchOpen(false);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={submitSearch}
                  disabled={disabled || searching}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--dni-primary)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {searching ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Search size={15} />
                  )}
                  Search
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                {isSellerArea
                  ? "Only products from your shop are listed."
                  : "Products from every shop are listed."}{" "}
                Type a product name, then press Search or Enter.
              </p>
            </div>
          )}

          {!isItemPickerLocked &&
            searchOpen &&
            searchDropdownPosition &&
            createPortal(
              <div
                ref={dropdownRef}
                style={{
                  top: searchDropdownPosition.top,
                  left: searchDropdownPosition.left,
                  width: searchDropdownPosition.width,
                  maxHeight: searchDropdownPosition.maxHeight,
                }}
                className="fixed z-[200] overflow-y-auto overscroll-contain rounded-lg border border-[var(--dni-border)] bg-white shadow-xl"
              >
                {searching ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-500">
                    <Loader2 size={14} className="animate-spin" />
                    Searching products...
                  </div>
                ) : searchScopeError ? (
                  <p className="px-4 py-3 text-xs text-amber-700">
                    {searchScopeError}
                  </p>
                ) : searchResults.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-slate-500">
                    No products found.
                  </p>
                ) : searchOptions.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-slate-500">
                    All matching products are already added.
                  </p>
                ) : (
                  <div
                    className={
                      searchDropdownPosition.width >=
                      SEARCH_DROPDOWN_TWO_COLUMN_MIN_WIDTH
                        ? "grid grid-cols-2 gap-1 p-1"
                        : "flex flex-col gap-1 p-1"
                    }
                  >
                    {searchOptions.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => addProduct(product)}
                        className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-slate-50 cursor-pointer"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
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
                            ${Number(product.price).toFixed(2)}
                            {Number.isFinite(product.stock)
                              ? ` · Stock ${product.stock}`
                              : ""}
                            {product.categoryName
                              ? ` · ${product.categoryName}`
                              : ""}
                          </p>
                          {!isSellerArea && product.shopName && (
                            <p className="truncate text-[11px] text-slate-400">
                              {product.shopName}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs font-medium text-[var(--dni-primary)]">
                          + Add
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>,
              document.body,
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
