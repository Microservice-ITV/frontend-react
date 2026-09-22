import type { FlashDealStatus } from "../types/flashDealTypes";

const STATUS_STYLES: Record<FlashDealStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-[var(--dni-primary-100)] text-[var(--dni-primary-700)]",
  PAUSED: "bg-amber-100 text-amber-700",
  ENDED: "bg-slate-200 text-slate-500",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<FlashDealStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  ACTIVE: "Active",
  PAUSED: "Paused",
  ENDED: "Ended",
  CANCELLED: "Cancelled",
};

interface FlashDealStatusBadgeProps {
  status: FlashDealStatus;
}

const FlashDealStatusBadge = ({ status }: FlashDealStatusBadgeProps) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT}`}
  >
    {STATUS_LABELS[status] ?? status}
  </span>
);

export default FlashDealStatusBadge;
