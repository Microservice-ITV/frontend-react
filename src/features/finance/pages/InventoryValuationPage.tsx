import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  RefreshCw,
  Search,
  Scale,
  Truck,
} from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { extractRoleFromUser } from "@/app/rbac/normalizers";
import { authClient } from "@/lib/api/authClient";
import { inventoryValuationApi } from "@/features/finance/api/inventoryValuationApi";
import type {
  InventoryValuationReport,
  InventoryValuationRow,
} from "@/features/finance/types/inventoryValuationTypes";
import {
  formatReportAmount,
  isValuationRowInScope,
  parseReportAmount,
} from "@/features/finance/utils/inventoryValuation";

type Shop = { shop_id?: string | null; shop_name?: string | null };
type AccessContextResponse = {
  data?: { access_context?: { active_shop?: Shop | null; shops?: Shop[] } };
};
type LoadStatus = "loading" | "succeeded" | "failed";

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
};

const errorMessage = (error: unknown) => {
  const status =
    error && typeof error === "object" && "response" in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined;
  const responseError =
    error && typeof error === "object" && "response" in error
      ? (error as { response?: { data?: { error?: unknown } } }).response?.data?.error
      : undefined;
  if (status === 404) {
    return "The running Accounting Service returned 404 for /api/v1/reports/inventory-valuation. Deploy or restart it with the inventory valuation reporting route.";
  }
  if (status === 401) return "Your session has expired. Sign in again to view inventory data.";
  if (status === 403 && typeof responseError === "string") return responseError;
  if (status === 403) return "You are not authorized to view this shop’s inventory valuation.";
  if (typeof responseError === "string") return responseError;
  return error instanceof Error && error.message
    ? error.message
    : "Unable to load inventory valuation.";
};

const money = (value: number | null | undefined) =>
  formatReportAmount(value, "MMK");

const MetricCard = ({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof CircleDollarSign;
}) => (
  <article className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
    <div className="flex items-start gap-3">
      <span className="rounded-full bg-blue-50 p-2.5 text-blue-700">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <h2 className="text-xs font-semibold text-slate-600">{label}</h2>
        <p className="mt-1.5 text-base font-bold text-slate-900">{value}</p>
        <p className="mt-1.5 text-[10px] leading-4 text-slate-500">{note}</p>
      </div>
    </div>
  </article>
);

const InventoryValuationPage = () => {
  const authUser = useAppSelector((state) => state.auth.user);
  const role = extractRoleFromUser(authUser);
  const isFinanceManager = role === "FINANCE_MANAGER";
  const [shops, setShops] = useState<Shop[]>([]);
  const [authorizedShopIds, setAuthorizedShopIds] = useState<string[]>([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [warehouseId, setWarehouseId] = useState("");
  const [sku, setSku] = useState("");
  const [report, setReport] = useState<InventoryValuationReport | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [valuationPage, setValuationPage] = useState(1);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setStatus("loading");
      setError(null);
      setReport(null);
      try {
        const access = await authClient.get<AccessContextResponse>("/me/access-context");
        const context = access.data.data?.access_context;
        const availableShops = context?.shops ?? [];
        const permittedIds = availableShops
          .map((shop) => shop.shop_id?.trim() ?? "")
          .filter(Boolean);
        const activeShopId =
          authUser?.active_shop_id?.trim() ||
          context?.active_shop?.shop_id?.trim() ||
          "";
        const authorizedIds = isFinanceManager
          ? permittedIds
          : [
              activeShopId &&
              (permittedIds.length === 0 || permittedIds.includes(activeShopId))
                ? activeShopId
                : permittedIds[0] ?? "",
            ].filter(Boolean);
        const requestedShopId =
          isFinanceManager && selectedShopId && authorizedIds.includes(selectedShopId)
            ? selectedShopId
            : "";
        const reportShopIds = requestedShopId
          ? [requestedShopId]
          : authorizedIds;

        if (active) {
          setShops(availableShops);
          setAuthorizedShopIds(authorizedIds);
          if (selectedShopId && !authorizedIds.includes(selectedShopId)) {
            setSelectedShopId("");
          }
        }
        if (!reportShopIds.length) {
          throw new Error("No authorized shop is available for this report.");
        }

        const response = await inventoryValuationApi.getReport({
          from: `${fromDate}T00:00:00.000Z`,
          to: `${toDate}T23:59:59.999Z`,
          shopIds: reportShopIds,
          ...(warehouseId ? { warehouseId } : {}),
          ...(sku.trim() ? { sku: sku.trim() } : {}),
          historyPage,
          historyPageSize: 20,
        });
        if (!active) return;
        setReport(response.data);
        setStatus("succeeded");
      } catch (cause) {
        if (!active) return;
        setReport(null);
        setStatus("failed");
        setError(errorMessage(cause));
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [
    authUser?.active_shop_id,
    fromDate,
    isFinanceManager,
    historyPage,
    refreshKey,
    selectedShopId,
    sku,
    toDate,
    warehouseId,
  ]);
  useEffect(() => {
    setHistoryPage(1);
    setValuationPage(1);
  }, [fromDate, toDate, selectedShopId, warehouseId, sku]);

  const selectedShopIds = useMemo(
    () =>
      isFinanceManager && selectedShopId
        ? [selectedShopId]
        : authorizedShopIds,
    [authorizedShopIds, isFinanceManager, selectedShopId],
  );
  const valuationRows = useMemo(
    () =>
      (report?.valuation ?? []).filter((row) =>
        isValuationRowInScope(row, authorizedShopIds, selectedShopIds),
      ),
    [authorizedShopIds, report, selectedShopIds],
  );
  const warehouseNames = useMemo(() => {
    const names = new Map<string, string>();
    valuationRows.forEach((row) => {
      if (!names.has(row.warehouseId)) names.set(row.warehouseId, row.warehouseId);
    });
    (report?.movementHistory?.items ?? []).forEach((row) => {
      if (row.warehouseId && !names.has(row.warehouseId)) {
        names.set(row.warehouseId, row.warehouseId);
      }
    });
    return names;
  }, [report, valuationRows]);
  const warehouseIds = useMemo(
    () => [...new Set([
      ...valuationRows.map((row) => row.warehouseId),
      ...(report?.movementHistory?.items ?? [])
        .map((row) => row.warehouseId)
        .filter((id): id is string => Boolean(id)),
    ])].sort(),
    [report, valuationRows],
  );
  const shopNames = useMemo(
    () => new Map(shops.map((shop) => [shop.shop_id ?? "", shop.shop_name ?? shop.shop_id ?? ""])),
    [shops],
  );

  const metrics = report?.metrics;
  const filteredRows: InventoryValuationRow[] = valuationRows.filter((row) => {
    if (warehouseId && row.warehouseId !== warehouseId) return false;
    const term = sku.trim().toLowerCase();
    return !term || row.sku?.toLowerCase().includes(term) || row.productId.toLowerCase().includes(term);
  });
  const valuationPageSize = 20;
  const valuationTotalPages = Math.max(1, Math.ceil(filteredRows.length / valuationPageSize));
  const visibleValuationRows = filteredRows.slice(
    (valuationPage - 1) * valuationPageSize,
    valuationPage * valuationPageSize,
  );
  const movementHistory = (report?.movementHistory?.items ?? []).filter((row) =>
    row.shopId
    && authorizedShopIds.includes(row.shopId)
    && selectedShopIds.includes(row.shopId),
  );
  const metricCards: Array<{
    label: string;
    value: number | null | undefined;
    note: string;
    icon: typeof CircleDollarSign;
  }> = [
    { label: "Inventory Value", value: metrics?.inventoryValueMmk, note: "Latest verified stock valuation at the selected report date.", icon: CircleDollarSign },
    { label: "Purchase Cost", value: metrics?.purchaseCostMmk, note: "Posted receipt movement cost in the selected period.", icon: CalendarDays },
    { label: "Landed Cost", value: metrics?.landedCostMmk, note: "Verified landed-cost allocation.", icon: Truck },
    { label: "COGS", value: metrics?.cogsMmk, note: "Verified cost of stock issued for sale.", icon: CircleDollarSign },
    { label: "Purchase Returns", value: metrics?.purchaseReturnsMmk, note: "Verified supplier-return cost in the selected period.", icon: RefreshCw },
    { label: "Sales Returns", value: metrics?.salesReturnsMmk, note: "Verified customer-return cost in the selected period.", icon: Boxes },
    { label: "Damaged Stock", value: metrics?.damagedStockValueMmk, note: "Verified damaged-stock value.", icon: AlertTriangle },
    { label: "Inventory Adjustments", value: metrics?.inventoryAdjustmentsMmk, note: "Verified inventory-adjustment value.", icon: Scale },
  ];

  return (
    <section className="space-y-4" aria-labelledby="inventory-valuation-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-lg border border-slate-200 bg-white p-2 text-blue-700 shadow-sm">
            <Boxes size={20} />
          </span>
          <div>
            <h1 id="inventory-valuation-title" className="text-xl font-bold tracking-tight text-slate-900">
              Inventory Valuation
            </h1>
            <p className="mt-0.5 max-w-3xl text-xs text-slate-500">
              Review stock value, purchase cost, COGS, and valuation by warehouse and SKU.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/seller/finance"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Finance Dashboard
          </Link>
          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            disabled={status === "loading"}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={status === "loading" ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2.5">
        <label className="grid gap-1 text-[10px] font-medium text-slate-500">
          From
          <input
            aria-label="Inventory report from"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
          />
        </label>
        <label className="grid gap-1 text-[10px] font-medium text-slate-500">
          To
          <input
            aria-label="Inventory report to"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
          />
        </label>
        {isFinanceManager && shops.length > 1 && (
          <label className="grid min-w-40 gap-1 text-[10px] font-medium text-slate-500">
            Shop
            <select
              aria-label="Inventory shop"
              value={selectedShopId}
              onChange={(event) => setSelectedShopId(event.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
            >
              <option value="">All authorized shops</option>
              {shops
                .filter((shop) => shop.shop_id && authorizedShopIds.includes(shop.shop_id))
                .map((shop) => (
                  <option key={shop.shop_id} value={shop.shop_id!}>
                    {shop.shop_name ?? shop.shop_id}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label className="grid min-w-40 gap-1 text-[10px] font-medium text-slate-500">
          Warehouse
          <select
            aria-label="Inventory warehouse"
            value={warehouseId}
            onChange={(event) => setWarehouseId(event.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700"
          >
            <option value="">All warehouses</option>
            {warehouseIds.map((id) => <option key={id} value={id}>{warehouseNames.get(id) ?? id}</option>)}
          </select>
        </label>
        <label className="grid min-w-36 gap-1 text-[10px] font-medium text-slate-500">
          SKU / Product
          <span className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              aria-label="Inventory SKU search"
              type="search"
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="SKU or product ID"
              className="h-9 w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-2.5 text-xs text-slate-700"
            />
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {status === "loading" && (
        <div role="status" aria-label="Loading inventory valuation" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
          <div className="h-56 animate-pulse rounded-lg bg-slate-200" />
        </div>
      )}
      {status === "succeeded" && report && (
        <>
          {!report.complete && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-900">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <p>
                Only verified Accounting figures are shown. Unavailable or unverified amounts are omitted.
              </p>
            </div>
          )}
          {metricCards.some((card) => card.value != null) && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metricCards.filter((card) => card.value != null).map((card) => (
                <MetricCard
                  key={card.label}
                  label={card.label}
                  value={money(card.value)}
                  note={card.note}
                  icon={card.icon}
                />
              ))}
            </div>
          )}
          {report.totalInventoryQuantity != null && (
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Total Inventory Quantity"
                value={report.totalInventoryQuantity.toLocaleString("en-US")}
                note={`Latest reported product-level stock snapshot${report.quantityAsOf ? ` · ${new Date(report.quantityAsOf).toLocaleString()}` : ""}. Warehouse breakdown is not present in this source event.`}
                icon={Boxes}
              />
              {report.totalAvailableQuantity != null && (
                <MetricCard
                  label="Available Quantity"
                  value={report.totalAvailableQuantity.toLocaleString("en-US")}
                  note="Latest reported product-level available stock."
                  icon={Boxes}
                />
              )}
            </div>
          )}
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Stock valuation by SKU and warehouse</h2>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  MMK · As of {report.inventoryAsOf ? new Date(report.inventoryAsOf).toLocaleString() : "Unavailable"}
                </p>
              </div>
              <span className="text-[10px] text-slate-500">{filteredRows.length} valuation rows</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="border-b border-slate-100 text-[10px] text-slate-500">
                  <tr>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Product / Variant</th>
                    <th className="px-3 py-2">Warehouse</th>
                    <th className="px-3 py-2">Shop</th>
                    <th className="px-3 py-2 text-right">On hand</th>
                    <th className="px-3 py-2 text-right">Average unit cost</th>
                    <th className="px-3 py-2 text-right">Inventory value</th>
                    <th className="px-3 py-2">Currency</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleValuationRows.length ? visibleValuationRows.map((row, index) => {
                    const quantity = parseReportAmount(row.onHandQty);
                    return (
                      <tr key={`${row.shopId}-${row.warehouseId}-${row.productId}-${row.variantId}-${index}`} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-3 font-semibold text-slate-800">{row.sku ?? "Unavailable"}</td>
                        <td className="px-3 py-3 text-slate-700">
                          {row.productId}<span className="mt-1 block text-[10px] text-slate-500">{row.variantId}</span>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{warehouseNames.get(row.warehouseId) ?? row.warehouseId}</td>
                        <td className="px-3 py-3 text-slate-700">{shopNames.get(row.shopId) ?? row.shopId}</td>
                        <td className="px-3 py-3 text-right text-slate-700">{quantity === null ? "Unavailable" : quantity.toLocaleString("en-US")}</td>
                        <td className="px-3 py-3 text-right text-slate-700">{money(row.averageUnitCostMmk)}</td>
                        <td className="px-3 py-3 text-right font-medium text-slate-800">{money(row.inventoryValueMmk)}</td>
                        <td className="px-3 py-3 text-slate-700">MMK</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                        No verified valuation rows match the selected filters. Existing Warehouse events do not include enough data to establish a financial valuation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredRows.length > valuationPageSize && (
              <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs">
                <span>Page {valuationPage} of {valuationTotalPages}</span>
                <div className="flex gap-2">
                  <button type="button" disabled={valuationPage <= 1} onClick={() => setValuationPage((page) => page - 1)} className="rounded border px-2 py-1 disabled:opacity-40">Previous</button>
                  <button type="button" disabled={valuationPage >= valuationTotalPages} onClick={() => setValuationPage((page) => page + 1)} className="rounded border px-2 py-1 disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
            <p className="border-t border-slate-100 px-3 py-2 text-[10px] text-slate-500">
              Opening stock with unknown cost is not valued from seller price overrides or latest purchase prices.
              {metrics?.reconciliationVarianceMmk == null
                ? " Independent ledger reconciliation is unavailable."
                : ""}
            </p>
            </section>
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-bold text-slate-900">Inventory movement history</h2>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Source events received by Accounting. Incomplete source amounts are not treated as inventory costs or valuation.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-xs">
                  <thead className="border-b border-slate-100 text-[10px] text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Movement</th>
                      <th className="px-3 py-2">Product / Variant</th>
                      <th className="px-3 py-2">Shop</th>
                      <th className="px-3 py-2">Warehouse</th>
                      <th className="px-3 py-2 text-right">Quantity / stock</th>
                      <th className="px-3 py-2 text-right">Source unit amount</th>
                      <th className="px-3 py-2">Currency</th>
                      <th className="px-3 py-2">Source reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementHistory.length ? movementHistory.map((movement, index) => (
                      <tr key={`${movement.sourceEventId}-${index}`} className="border-b border-slate-50 last:border-0">
                        <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                          {new Date(movement.occurredAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {movement.movementType ?? movement.eventType}
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {movement.sku ?? movement.productId ?? "Unavailable"}
                          {movement.variantId && <span className="mt-1 block text-[10px] text-slate-500">{movement.variantId}</span>}
                        </td>
                        <td className="px-3 py-3 text-slate-700">{movement.shopId ? shopNames.get(movement.shopId) ?? movement.shopId : "Unavailable"}</td>
                        <td className="px-3 py-3 text-slate-700">
                          {movement.warehouseId ? warehouseNames.get(movement.warehouseId) ?? movement.warehouseId : "Unavailable"}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-700">
                          {movement.quantity != null
                            ? movement.quantity.toLocaleString("en-US")
                            : movement.onHandQty != null
                              ? movement.onHandQty.toLocaleString("en-US")
                              : movement.availableQty != null
                                ? `${movement.availableQty.toLocaleString("en-US")} available`
                                : "Unavailable"}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-700">
                          {movement.reportedUnitCost == null
                            ? "Unavailable"
                            : Number(movement.reportedUnitCost).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                        </td>
                        <td className="px-3 py-3 text-slate-700">{movement.currency ?? "Unknown"}</td>
                        <td className="px-3 py-3 text-slate-600">
                          {movement.sourceDocumentType && movement.sourceDocumentId
                            ? `${movement.sourceDocumentType} · ${movement.sourceDocumentId}`
                            : movement.correlationId}
                          <span className="mt-1 block text-[10px] text-slate-500">Event {movement.sourceEventId}</span>
                          <span className="mt-1 block text-[10px] text-amber-700">{movement.blockReason}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                          No Accounting source events match these filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {report.movementHistory && report.movementHistory.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs">
                  <span>{report.movementHistory.total} source records · page {report.movementHistory.page} of {report.movementHistory.totalPages}</span>
                  <div className="flex gap-2">
                    <button type="button" disabled={historyPage <= 1} onClick={() => setHistoryPage((page) => page - 1)} className="rounded border px-2 py-1 disabled:opacity-40">Previous</button>
                    <button type="button" disabled={historyPage >= report.movementHistory.totalPages} onClick={() => setHistoryPage((page) => page + 1)} className="rounded border px-2 py-1 disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
          </section>
        </>
      )}
    </section>
  );
};

export default InventoryValuationPage;
