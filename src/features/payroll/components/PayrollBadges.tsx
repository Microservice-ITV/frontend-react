import StatusBadge, { type BadgeTone } from '@/components/ui/StatusBadge'
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYROLL_AUDIT_ACTION_LABELS,
  PAYROLL_RUN_STATUS_LABELS,
  PAYSLIP_STATUS_LABELS,
  type PaymentMethod,
  type PaymentStatus,
  type PayrollAuditAction,
  type PayrollLineType,
  type PayrollRunStatus,
  type PayslipStatus,
} from '../types/payrollTypes'

export const PAYROLL_RUN_STATUS_TONES: Record<PayrollRunStatus, BadgeTone> = {
  DRAFT: 'neutral',
  CALCULATED: 'info',
  UNDER_REVIEW: 'warning',
  APPROVED: 'brand',
  PAID: 'success',
  VOID: 'danger',
}

export const PAYSLIP_STATUS_TONES: Record<PayslipStatus, BadgeTone> = {
  GENERATED: 'info',
  ISSUED: 'success',
  REVOKED: 'danger',
}

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, BadgeTone> = {
  PENDING: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger',
  RECONCILED: 'info',
}

export const PAYMENT_METHOD_TONES: Record<PaymentMethod, BadgeTone> = {
  BANK_TRANSFER: 'info',
  CASH: 'neutral',
  MOBILE_PAY: 'brand',
}

export const PAYROLL_LINE_TYPE_TONES: Record<PayrollLineType, BadgeTone> = {
  EARNING: 'success',
  DEDUCTION: 'danger',
}

export const PAYROLL_AUDIT_TONES: Record<PayrollAuditAction, BadgeTone> = {
  CREATED: 'neutral',
  CALCULATED: 'info',
  RECALCULATED: 'info',
  SUBMITTED: 'warning',
  APPROVED: 'brand',
  REJECTED: 'danger',
  PAID: 'success',
  VOIDED: 'danger',
  ITEM_ADJUSTED: 'warning',
  PAYMENT_RECORDED: 'success',
  PAYSLIP_ISSUED: 'success',
  PAYSLIP_REVOKED: 'danger',
}

export const PayrollRunStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: PayrollRunStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={PAYROLL_RUN_STATUS_LABELS[status]}
    tone={PAYROLL_RUN_STATUS_TONES[status]}
    size={size}
  />
)

export const PayslipStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: PayslipStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge label={PAYSLIP_STATUS_LABELS[status]} tone={PAYSLIP_STATUS_TONES[status]} size={size} />
)

export const PaymentStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: PaymentStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={PAYMENT_STATUS_LABELS[status]}
    tone={PAYMENT_STATUS_TONES[status]}
    size={size}
  />
)

export const PaymentMethodBadge = ({
  method,
  size = 'sm',
}: {
  method: PaymentMethod
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={PAYMENT_METHOD_LABELS[method]}
    tone={PAYMENT_METHOD_TONES[method]}
    size={size}
  />
)

export const PayrollLineTypeBadge = ({
  type,
  size = 'sm',
}: {
  type: PayrollLineType
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={type === 'EARNING' ? 'Earning' : 'Deduction'}
    tone={PAYROLL_LINE_TYPE_TONES[type]}
    size={size}
  />
)

export const PayrollAuditActionBadge = ({
  action,
  size = 'sm',
}: {
  action: PayrollAuditAction
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={PAYROLL_AUDIT_ACTION_LABELS[action]}
    tone={PAYROLL_AUDIT_TONES[action]}
    size={size}
  />
)
