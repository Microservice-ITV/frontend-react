import StatusBadge, { type BadgeTone } from '@/components/ui/StatusBadge'
import {
  LEAVE_REQUEST_STATUS_LABELS,
  LEAVE_TRANSACTION_TYPE_LABELS,
  type LeaveRequestStatus,
  type LeaveTransactionType,
} from '../types/leaveTypes'

export const LEAVE_REQUEST_STATUS_TONES: Record<LeaveRequestStatus, BadgeTone> = {
  PENDING: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
}

export const LEAVE_TRANSACTION_TYPE_TONES: Record<LeaveTransactionType, BadgeTone> = {
  ACCRUAL: 'success',
  RESERVATION: 'info',
  DEDUCTION: 'brand',
  CANCELLATION_RELEASE: 'warning',
  ADJUSTMENT: 'warning',
  EXPIRY: 'danger',
}

export const LeaveRequestStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: LeaveRequestStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={LEAVE_REQUEST_STATUS_LABELS[status]}
    tone={LEAVE_REQUEST_STATUS_TONES[status]}
    size={size}
  />
)

export const LeaveTransactionTypeBadge = ({
  type,
  size = 'sm',
}: {
  type: LeaveTransactionType
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={LEAVE_TRANSACTION_TYPE_LABELS[type]}
    tone={LEAVE_TRANSACTION_TYPE_TONES[type]}
    size={size}
  />
)
