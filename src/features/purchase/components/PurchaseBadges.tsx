import StatusBadge, { type BadgeTone } from '@/components/ui/StatusBadge'
import {
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_RECEIPT_STATUS_LABELS,
  PURCHASE_RETURN_STATUS_LABELS,
  type PurchaseOrderStatus,
  type PurchaseReceiptStatus,
  type PurchaseReturnStatus,
  type SupplierStatus,
} from '../types/purchaseTypes'

export const PURCHASE_ORDER_STATUS_TONES: Record<PurchaseOrderStatus, BadgeTone> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  PENDING: 'warning',
  APPROVED: 'info',
  ORDERED: 'info',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success',
  CLOSED: 'neutral',
  CANCELLED: 'danger',
}

export const PURCHASE_DOCUMENT_STATUS_TONES: Record<
  PurchaseReceiptStatus | PurchaseReturnStatus,
  BadgeTone
> = {
  DRAFT: 'neutral',
  POSTED: 'success',
  CANCELLED: 'danger',
}

export const SUPPLIER_STATUS_TONES: Record<SupplierStatus, BadgeTone> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
}

export const PurchaseOrderStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: PurchaseOrderStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={PURCHASE_ORDER_STATUS_LABELS[status] ?? status}
    tone={PURCHASE_ORDER_STATUS_TONES[status] ?? 'neutral'}
    size={size}
  />
)

export const PurchaseReceiptStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: PurchaseReceiptStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={PURCHASE_RECEIPT_STATUS_LABELS[status] ?? status}
    tone={PURCHASE_DOCUMENT_STATUS_TONES[status] ?? 'neutral'}
    size={size}
  />
)

export const PurchaseReturnStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: PurchaseReturnStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={PURCHASE_RETURN_STATUS_LABELS[status] ?? status}
    tone={PURCHASE_DOCUMENT_STATUS_TONES[status] ?? 'neutral'}
    size={size}
  />
)

export const SupplierStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: SupplierStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={status === 'ACTIVE' ? 'Active' : 'Inactive'}
    tone={SUPPLIER_STATUS_TONES[status]}
    size={size}
  />
)
