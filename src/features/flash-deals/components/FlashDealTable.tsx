import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Pencil, Trash2, PackagePlus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch } from "@/app/store";
import { useGlobalModal } from "@/components/ui/GlobalModalProvider";
import {
  deleteFlashDeal,
  runFlashDealLifecycleAction,
  updateFlashDealStock,
} from "../store/flashDealThunks";
import {
  selectFlashDealsActioning,
  selectFlashDealsDeleting,
  selectFlashDealsSubmitting,
} from "../store/flashDealSelectors";
import type {
  FlashDeal,
  FlashDealLifecycleAction,
} from "../types/flashDealTypes";
import FlashDealStatusBadge from "./FlashDealStatusBadge";
import StockTopUpModal, { type StockTopUpDraft } from "./StockTopUpModal";

const ACTIONS_MENU_WIDTH = 140;
const ACTIONS_MENU_HEIGHT = 84;

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const STATIC_TERMINAL_STATUSES = new Set(["ENDED", "CANCELLED"]);

interface FlashDealTableProps {
  deals: FlashDeal[];
  loading: boolean;
  error: string | null;
  onEdit: (id: string) => void;
  footer?: ReactNode;
}

const FlashDealTable = ({
  deals,
  loading,
  error,
  onEdit,
  footer,
}: FlashDealTableProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { openModal } = useGlobalModal();

  const actioning = useSelector(selectFlashDealsActioning);
  const deleting = useSelector(selectFlashDealsDeleting);
  const submitting = useSelector(selectFlashDealsSubmitting);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const topUpDraftRef = useRef<StockTopUpDraft>({});

  const closeMenu = () => {
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const openMenu = (id: string, button: HTMLButtonElement) => {
    if (openMenuId === id) {
      closeMenu();
      return;
    }

    const rect = button.getBoundingClientRect();
    const openUpward =
      window.innerHeight - rect.bottom < ACTIONS_MENU_HEIGHT + 8;
    const top = openUpward
      ? rect.top - ACTIONS_MENU_HEIGHT - 4
      : rect.bottom + 4;
    const left = Math.min(
      Math.max(8, rect.right - ACTIONS_MENU_WIDTH),
      window.innerWidth - ACTIONS_MENU_WIDTH - 8,
    );

    setMenuPosition({ top, left });
    setOpenMenuId(id);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const activeButton = openMenuId ? buttonRefs.current[openMenuId] : null;
      if (menuRef.current?.contains(target) || activeButton?.contains(target)) {
        return;
      }
      closeMenu();
    };
    const handleRepositionClose = () => closeMenu();

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", handleRepositionClose);
      window.addEventListener("scroll", handleRepositionClose, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleRepositionClose);
      window.removeEventListener("scroll", handleRepositionClose, true);
    };
  }, [openMenuId]);

  const quickActionFor = (
    deal: FlashDeal,
  ): { label: string; action?: FlashDealLifecycleAction } => {
    switch (deal.status) {
      case "DRAFT":
      case "SCHEDULED":
        // Publishing transitions straight to ACTIVE, so no extra "Start Now"
        // step is needed for deals that were scheduled before that flow existed.
        return { label: "Publish", action: "publish" };
      case "ACTIVE":
        return { label: "Pause", action: "pause" };
      case "PAUSED":
        return { label: "Resume", action: "activate" };
      default:
        return { label: "", action: undefined };
    }
  };

  const runAction = async (
    deal: FlashDeal,
    action: FlashDealLifecycleAction,
  ) => {
    await dispatch(
      runFlashDealLifecycleAction({ id: deal.id, action }),
    ).unwrap();
  };

  const handleQuickAction = (deal: FlashDeal) => {
    const { label, action } = quickActionFor(deal);
    if (!action) return;
    openModal({
      title: `${label} flash deal?`,
      content: (
        <p>
          Are you sure you want to <strong>{label.toLowerCase()}</strong> the
          flash deal <strong>{deal.name}</strong>?
        </p>
      ),
      primaryLabel: label,
      onPrimary: () => runAction(deal, action),
    });
  };

  const handleCancel = (deal: FlashDeal) => {
    openModal({
      title: "Cancel flash deal?",
      content: (
        <p>
          Cancelling <strong>{deal.name}</strong> immediately stops the deal.
          This action cannot be undone.
        </p>
      ),
      primaryLabel: "Cancel Deal",
      primaryVariant: "danger",
      onPrimary: () => runAction(deal, "cancel"),
    });
  };

  const handleDelete = (deal: FlashDeal) => {
    openModal({
      title: "Delete flash deal?",
      content: (
        <p>
          Are you sure you want to delete the <strong>{deal.name}</strong> flash
          deal? This action cannot be undone.
        </p>
      ),
      primaryLabel: "Delete",
      primaryVariant: "danger",
      onPrimary: async () => {
        await dispatch(deleteFlashDeal(deal.id)).unwrap();
      },
    });
  };

  const handleTopUp = (deal: FlashDeal) => {
    topUpDraftRef.current = Object.fromEntries(
      deal.items.map((item) => [item.id, item.allocatedQuantity]),
    );
    openModal({
      title: "Top Up Deal Stock",
      content: (
        <StockTopUpModal
          deal={deal}
          onDraftChange={(draft) => {
            topUpDraftRef.current = draft;
          }}
        />
      ),
      primaryLabel: "Save Top Up",
      onPrimary: async () => {
        const items = deal.items.map((item) => ({
          itemId: item.id,
          allocatedQuantity:
            topUpDraftRef.current[item.id] ?? item.allocatedQuantity,
        }));
        await dispatch(
          updateFlashDealStock({ id: deal.id, payload: { items } }),
        ).unwrap();
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-500">Loading flash deals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--dni-border)] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--dni-border)] bg-white">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                Slot Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                Items
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                Schedule
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                Actions
              </th>
              <th className="w-14 px-2 py-3 text-left text-xs font-medium text-slate-600">
                {" "}
              </th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  No flash deals found.
                </td>
              </tr>
            ) : (
              deals.map((deal) => {
                const quickAction = quickActionFor(deal);
                const canCancel = !STATIC_TERMINAL_STATUSES.has(deal.status);
                const canTopUp =
                  deal.status === "ACTIVE" || deal.status === "PAUSED";
                return (
                  <tr
                    key={deal.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="max-w-[220px] px-4 py-3">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {deal.name}
                      </span>
                      {deal.description && (
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {deal.description}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold tabular-nums text-slate-900">
                        {deal.slotTime ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <FlashDealStatusBadge status={deal.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-700">
                        {deal.items.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-600">
                          Starts {formatDateTime(deal.startAt)}
                        </p>
                        <p className="text-xs text-slate-600">
                          Ends {formatDateTime(deal.endAt)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {quickAction.action && (
                          <button
                            type="button"
                            disabled={actioning || submitting}
                            onClick={() => handleQuickAction(deal)}
                            className="rounded-lg bg-[var(--dni-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--dni-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                          >
                            {quickAction.label}
                          </button>
                        )}
                        {canTopUp && (
                          <button
                            type="button"
                            disabled={actioning || submitting}
                            onClick={() => handleTopUp(deal)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--dni-primary-200)] bg-[var(--dni-primary-soft)] px-3 py-1.5 text-xs font-medium text-[var(--dni-primary)] hover:bg-[var(--dni-primary-100)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                          >
                            <PackagePlus size={13} />
                            Top Up
                          </button>
                        )}
                        {canCancel && (
                          <button
                            type="button"
                            disabled={actioning || submitting}
                            onClick={() => handleCancel(deal)}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="w-14 px-2 py-3">
                      <button
                        ref={(node) => {
                          buttonRefs.current[deal.id] = node;
                        }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMenu(deal.id, e.currentTarget);
                        }}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                        aria-label="Actions"
                        aria-expanded={openMenuId === deal.id}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {footer}

      {openMenuId &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: ACTIONS_MENU_WIDTH,
            }}
            className="fixed z-[100] rounded-lg border border-[var(--dni-border)] bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              onClick={() => {
                const id = openMenuId;
                closeMenu();
                onEdit(id);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Pencil size={16} className="shrink-0 text-slate-500" />
              Edit
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                const deal = deals.find((item) => item.id === openMenuId);
                closeMenu();
                if (deal) handleDelete(deal);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <Trash2 size={16} className="shrink-0 text-slate-500" />
              Delete
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default FlashDealTable;
