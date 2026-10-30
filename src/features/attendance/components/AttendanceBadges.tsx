import StatusBadge, { type BadgeTone } from '@/components/ui/StatusBadge'
import {
  ADJUSTMENT_STATUS_LABELS,
  ATTENDANCE_STATUS_LABELS,
  OVERTIME_STATUS_LABELS,
  type AdjustmentStatus,
  type AttendanceStatus,
  type OvertimeStatus,
} from '../types/attendanceTypes'

export const ATTENDANCE_STATUS_TONES: Record<AttendanceStatus, BadgeTone> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  LATE: 'warning',
  PENDING_REVIEW: 'info',
}

export const OVERTIME_STATUS_TONES: Record<OvertimeStatus, BadgeTone> = {
  PENDING: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
}

export const ADJUSTMENT_STATUS_TONES: Record<AdjustmentStatus, BadgeTone> = {
  PENDING: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
}

export const AttendanceStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: AttendanceStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={ATTENDANCE_STATUS_LABELS[status]}
    tone={ATTENDANCE_STATUS_TONES[status]}
    size={size}
  />
)

export const OvertimeStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: OvertimeStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={OVERTIME_STATUS_LABELS[status]}
    tone={OVERTIME_STATUS_TONES[status]}
    size={size}
  />
)

export const AdjustmentStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: AdjustmentStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={ADJUSTMENT_STATUS_LABELS[status]}
    tone={ADJUSTMENT_STATUS_TONES[status]}
    size={size}
  />
)
