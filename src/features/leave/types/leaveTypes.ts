import type { Paginated } from '@/features/employees/types/employeeTypes'
import type { Position } from '@/features/employees/types/employeeTypes'

export type { Paginated }

export const LEAVE_ACCRUAL_METHODS = ['UPFRONT', 'MONTHLY', 'NONE'] as const
export type LeaveAccrualMethod = (typeof LEAVE_ACCRUAL_METHODS)[number]

export const LEAVE_ACCRUAL_METHOD_LABELS: Record<LeaveAccrualMethod, string> = {
  UPFRONT: 'Upfront',
  MONTHLY: 'Monthly accrual',
  NONE: 'No accrual',
}

export const LEAVE_REQUEST_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const
export type LeaveRequestStatus = (typeof LEAVE_REQUEST_STATUSES)[number]

export const LEAVE_REQUEST_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

export const LEAVE_APPROVAL_DECISIONS = ['APPROVED', 'REJECTED'] as const
export type LeaveApprovalDecision = (typeof LEAVE_APPROVAL_DECISIONS)[number]

export const LEAVE_APPROVAL_DECISION_LABELS: Record<LeaveApprovalDecision, string> = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export const LEAVE_TRANSACTION_TYPES = [
  'ACCRUAL',
  'RESERVATION',
  'DEDUCTION',
  'CANCELLATION_RELEASE',
  'ADJUSTMENT',
  'EXPIRY',
] as const
export type LeaveTransactionType = (typeof LEAVE_TRANSACTION_TYPES)[number]

export const LEAVE_TRANSACTION_TYPE_LABELS: Record<LeaveTransactionType, string> = {
  ACCRUAL: 'Accrual',
  RESERVATION: 'Reservation',
  DEDUCTION: 'Deduction',
  CANCELLATION_RELEASE: 'Cancellation release',
  ADJUSTMENT: 'Adjustment',
  EXPIRY: 'Expiry',
}

export interface LeaveType {
  id: string
  code: string
  name: string
  is_paid: boolean
  requires_document: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface LeaveTypePayload {
  code: string
  name: string
  is_paid?: boolean
  requires_document?: boolean
  is_active?: boolean
}

export interface LeavePolicy {
  id: string
  leave_type_id: string
  name: string
  entitlement_days: string
  accrual_method: LeaveAccrualMethod
  carry_forward_limit: string
  effective_from: string
  effective_to: string | null
  created_at?: string
  updated_at?: string
  leave_type?: LeaveType | null
}

export interface LeavePolicyPayload {
  leave_type_id: string
  name: string
  entitlement_days: number
  accrual_method?: LeaveAccrualMethod
  carry_forward_limit?: number
  effective_from: string
  effective_to?: string | null
}

export const POSITION_LEAVE_ALLOCATION_STATUSES = ['active', 'inactive'] as const
export type PositionLeaveAllocationStatus = (typeof POSITION_LEAVE_ALLOCATION_STATUSES)[number]

export interface PositionLeavePolicy {
  id: string
  position_id: string
  leave_policy_id: string
  entitlement_days: string | null
  is_mandatory: boolean
  effective_from: string
  effective_to: string | null
  status: PositionLeaveAllocationStatus
  created_at?: string
  updated_at?: string
  position?: Position | null
  leave_policy?: LeavePolicy | null
}

export interface PositionLeavePolicyPayload {
  leave_policy_id: string
  entitlement_days?: number | null
  is_mandatory?: boolean
  effective_from: string
  effective_to?: string | null
  status?: PositionLeaveAllocationStatus
}

export const COMPANY_POLICY_CATEGORIES = [
  'LEAVE',
  'ATTENDANCE',
  'PAYROLL',
  'GENERAL',
] as const
export type CompanyPolicyCategory = (typeof COMPANY_POLICY_CATEGORIES)[number]

export const COMPANY_POLICY_STATUSES = ['active', 'inactive'] as const
export type CompanyPolicyStatus = (typeof COMPANY_POLICY_STATUSES)[number]

export interface CompanyPolicy {
  id: string
  code: string
  title: string
  category: string
  description: string | null
  effective_from: string
  effective_to: string | null
  status: CompanyPolicyStatus
  created_at?: string
  updated_at?: string
}

export interface CompanyPolicyPayload {
  code: string
  title: string
  category?: string
  description?: string | null
  effective_from: string
  effective_to?: string | null
  status?: CompanyPolicyStatus
}

export interface LeaveBalance {
  id: string
  employee_id: string
  leave_policy_id: string
  leave_year: number
  entitled_days: string
  accrued_days: string
  used_days: string
  pending_days: string
  adjusted_days: string
  available_days?: number
  created_at?: string
  updated_at?: string
  employee?: {
    id: string
    full_name: string
    employee_code: string
  } | null
  leave_policy?: LeavePolicy | null
  leave_balance_transactions?: LeaveBalanceTransaction[]
}

export interface LeaveBalanceAdjustPayload {
  days: number
  reason?: string | null
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_policy_id: string
  start_date: string
  end_date: string
  requested_days: string
  reason: string | null
  status: LeaveRequestStatus
  document_url: string | null
  submitted_at: string | null
  created_at?: string
  updated_at?: string
  employee?: {
    id: string
    full_name: string
    employee_code: string
  } | null
  leave_policy?: LeavePolicy | null
  leave_approvals?: LeaveApproval[]
}

export interface LeaveRequestPayload {
  employee_id?: string | null
  leave_policy_id: string
  start_date: string
  end_date: string
  reason?: string | null
  document_url?: string | null
}

export interface LeaveApproval {
  id: string
  leave_request_id: string
  step_order: number
  approver_user_id: string | null
  decision: LeaveApprovalDecision | null
  comment: string | null
  decided_at: string | null
  created_at?: string
  updated_at?: string
  leave_request?: LeaveRequest | null
}

export interface LeaveBalanceTransaction {
  id: string
  leave_balance_id: string
  transaction_type: LeaveTransactionType
  days: string
  source_type: string | null
  source_id: string | null
  created_at?: string
  updated_at?: string
}

export interface LeaveListParams {
  employee_id?: string
  leave_policy_id?: string
  status?: LeaveRequestStatus | ''
  leave_year?: number
  from?: string
  to?: string
  manager_user_id?: string
  per_page?: number
}

export const formatDays = (value?: number | string | null): string => {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(numeric)) return '—'
  return `${Number.isInteger(numeric) ? numeric : numeric.toFixed(2)} day${numeric === 1 ? '' : 's'}`
}

export const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

export const employeeLabel = (
  employee?: { full_name?: string; employee_code?: string } | null,
): string => {
  if (!employee) return '—'
  const name = employee.full_name?.trim() || 'Unknown'
  return employee.employee_code ? `${name} (${employee.employee_code})` : name
}

export const leaveTypeLabel = (policy?: LeavePolicy | null): string =>
  policy?.leave_type?.name ?? policy?.name ?? '—'
