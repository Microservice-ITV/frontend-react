import type { Paginated } from '@/features/employees/types/employeeTypes'

export type { Paginated }

export const PAYROLL_RUN_STATUSES = [
  'DRAFT',
  'CALCULATED',
  'UNDER_REVIEW',
  'APPROVED',
  'PAID',
  'VOID',
] as const
export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[number]

export const PAYROLL_RUN_STATUS_LABELS: Record<PayrollRunStatus, string> = {
  DRAFT: 'Draft',
  CALCULATED: 'Calculated',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  PAID: 'Paid',
  VOID: 'Void',
}

export const PAYROLL_RUN_EDITABLE_STATUSES: PayrollRunStatus[] = [
  'DRAFT',
  'CALCULATED',
  'UNDER_REVIEW',
]

export const PAYROLL_LINE_TYPES = ['EARNING', 'DEDUCTION'] as const
export type PayrollLineType = (typeof PAYROLL_LINE_TYPES)[number]

export const PAYROLL_LINE_CATEGORIES = [
  'BASE_SALARY',
  'OVERTIME',
  'ALLOWANCE',
  'COMMISSION',
  'BONUS',
  'OTHER_EARNING',
  'UNPAID_LEAVE',
  'ABSENCE',
  'LATENESS',
  'TAX',
  'OTHER_DEDUCTION',
] as const
export type PayrollLineCategory = (typeof PAYROLL_LINE_CATEGORIES)[number]

export const PAYROLL_LINE_CATEGORY_LABELS: Record<PayrollLineCategory, string> = {
  BASE_SALARY: 'Base salary',
  OVERTIME: 'Overtime',
  ALLOWANCE: 'Allowance',
  COMMISSION: 'Commission',
  BONUS: 'Bonus',
  OTHER_EARNING: 'Other earning',
  UNPAID_LEAVE: 'Unpaid leave',
  ABSENCE: 'Absence',
  LATENESS: 'Lateness',
  TAX: 'Income tax',
  OTHER_DEDUCTION: 'Other deduction',
}

/** Categories the engine owns and rewrites on recalculation. */
export const PAYROLL_SYSTEM_CATEGORIES: PayrollLineCategory[] = [
  'BASE_SALARY',
  'OVERTIME',
  'UNPAID_LEAVE',
  'ABSENCE',
  'LATENESS',
  'TAX',
]

/** Categories a payroll officer may add manually. */
export const PAYROLL_MANUAL_CATEGORIES: PayrollLineCategory[] = [
  'ALLOWANCE',
  'COMMISSION',
  'BONUS',
  'OTHER_EARNING',
  'OTHER_DEDUCTION',
]

export const PAYSLIP_STATUSES = ['GENERATED', 'ISSUED', 'REVOKED'] as const
export type PayslipStatus = (typeof PAYSLIP_STATUSES)[number]

export const PAYSLIP_STATUS_LABELS: Record<PayslipStatus, string> = {
  GENERATED: 'Generated',
  ISSUED: 'Issued',
  REVOKED: 'Revoked',
}

export const PAYMENT_METHODS = ['BANK_TRANSFER', 'CASH', 'MOBILE_PAY'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Bank transfer',
  CASH: 'Cash',
  MOBILE_PAY: 'Mobile pay',
}

export const PAYMENT_STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'RECONCILED'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  SUCCESS: 'Success',
  FAILED: 'Failed',
  RECONCILED: 'Reconciled',
}

export const PAYROLL_AUDIT_ACTIONS = [
  'CREATED',
  'CALCULATED',
  'RECALCULATED',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'PAID',
  'VOIDED',
  'ITEM_ADJUSTED',
  'PAYMENT_RECORDED',
  'PAYSLIP_ISSUED',
  'PAYSLIP_REVOKED',
] as const
export type PayrollAuditAction = (typeof PAYROLL_AUDIT_ACTIONS)[number]

export const PAYROLL_AUDIT_ACTION_LABELS: Record<PayrollAuditAction, string> = {
  CREATED: 'Created',
  CALCULATED: 'Calculated',
  RECALCULATED: 'Recalculated',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAID: 'Paid',
  VOIDED: 'Voided',
  ITEM_ADJUSTED: 'Item adjusted',
  PAYMENT_RECORDED: 'Payment recorded',
  PAYSLIP_ISSUED: 'Payslip issued',
  PAYSLIP_REVOKED: 'Payslip revoked',
}

export interface EmployeeRef {
  id: string
  full_name: string
  employee_code: string
}

export interface PayrollPolicy {
  id: string
  shop_id: string | null
  name: string
  currency: string
  standard_working_days: number
  standard_daily_hours: string
  overtime_rate_multiplier: string
  tax_rate: string
  lateness_deduction_per_minute: string
  absence_deduction_per_day: string
  unpaid_leave_deduction_per_day: string
  is_active: boolean
  effective_from: string | null
  effective_to: string | null
  created_at?: string
  updated_at?: string
}

export interface PayrollPolicyPayload {
  shop_id?: string | null
  name: string
  currency?: string
  standard_working_days?: number
  standard_daily_hours?: number
  overtime_rate_multiplier?: number
  tax_rate?: number
  lateness_deduction_per_minute?: number
  absence_deduction_per_day?: number
  unpaid_leave_deduction_per_day?: number
  is_active?: boolean
  effective_from?: string | null
  effective_to?: string | null
}

export interface PayrollItemLine {
  id: string
  payroll_item_id: string
  line_type: PayrollLineType
  category: PayrollLineCategory
  description: string | null
  quantity: string
  rate: string
  amount: string
  source_type: string | null
  source_id: string | null
  meta: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export interface PayrollItemSnapshot {
  employee?: EmployeeRef | null
  period?: { start: string; end: string } | null
  policy?: {
    id: string
    name: string
    standard_working_days: number
    standard_daily_hours: number
    overtime_rate_multiplier: number
    tax_rate: number
  } | null
  rates?: { base_salary: number; daily_rate: number; hourly_rate: number } | null
  attendance?: {
    worked_days: number
    absent_days: number
    unpaid_leave_days: number
    paid_leave_days: number
    lateness_minutes: number
  } | null
  overtime_minutes?: number
  generated_at?: string
}

export interface PayrollItem {
  id: string
  payroll_run_id: string
  employee_id: string
  base_salary: string
  gross_pay: string
  total_deductions: string
  net_pay: string
  currency: string
  worked_days: string
  absent_days: string
  unpaid_leave_days: string
  overtime_minutes: number
  snapshot: PayrollItemSnapshot | null
  created_at?: string
  updated_at?: string
  employee?: EmployeeRef | null
  lines?: PayrollItemLine[]
  payslip?: Payslip | null
}

export interface PayrollRun {
  id: string
  reference: string
  period_start: string
  period_end: string
  pay_date: string | null
  status: PayrollRunStatus
  shop_id: string | null
  payroll_policy_id: string | null
  currency: string
  total_gross: string
  total_deductions: string
  total_net: string
  employee_count: number
  prepared_by: string | null
  approved_by: string | null
  calculated_at: string | null
  reviewed_at: string | null
  approved_at: string | null
  paid_at: string | null
  locked_at: string | null
  notes: string | null
  created_at?: string
  updated_at?: string
  payroll_policy?: PayrollPolicy | null
  items?: PayrollItem[]
  audit_logs?: PayrollAuditLog[]
}

export interface PayrollRunPayload {
  reference?: string
  period_start: string
  period_end: string
  pay_date?: string | null
  shop_id?: string | null
  payroll_policy_id?: string | null
  currency?: string
  notes?: string | null
}

export interface PayrollAdjustmentPayload {
  category: PayrollLineCategory
  description?: string | null
  quantity?: number
  rate?: number
  amount?: number
}

export interface Payslip {
  id: string
  payslip_number: string
  payroll_run_id: string
  payroll_item_id: string
  employee_id: string
  status: PayslipStatus
  generated_at: string | null
  issued_at: string | null
  revoked_at: string | null
  file_url: string | null
  snapshot: {
    employee?: EmployeeRef | null
    period?: { start: string; end: string } | null
    base_salary?: number
    gross_pay?: number
    total_deductions?: number
    net_pay?: number
    currency?: string
    lines?: Array<{ line_type: PayrollLineType; category: string; description: string | null; amount: number }>
    generated_at?: string
  } | null
  created_at?: string
  updated_at?: string
  employee?: EmployeeRef | null
  payroll_run?: PayrollRun | null
  payroll_item?: PayrollItem | null
}

export interface PaymentRecord {
  id: string
  payroll_run_id: string
  payroll_item_id: string | null
  employee_id: string | null
  method: PaymentMethod
  status: PaymentStatus
  amount: string
  currency: string
  reference: string | null
  bank_name: string | null
  account_last4: string | null
  paid_at: string | null
  processed_by: string | null
  notes: string | null
  meta: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
  employee?: EmployeeRef | null
  payroll_run?: PayrollRun | null
}

export interface PaymentRecordPayload {
  payroll_item_id?: string | null
  employee_id?: string | null
  method: PaymentMethod
  status?: PaymentStatus
  amount?: number
  currency?: string
  reference?: string | null
  bank_name?: string | null
  account_last4?: string | null
  notes?: string | null
}

export interface PayrollAuditLog {
  id: string
  payroll_run_id: string
  action: PayrollAuditAction
  actor_id: string | null
  actor_name: string | null
  description: string | null
  meta: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export interface PayrollRunListParams {
  status?: PayrollRunStatus | ''
  shop_id?: string
  from?: string
  to?: string
  search?: string
  per_page?: number
}

export interface PayslipListParams {
  employee_id?: string
  payroll_run_id?: string
  status?: PayslipStatus | ''
  per_page?: number
}

export interface PaymentListParams {
  payroll_run_id?: string
  employee_id?: string
  status?: PaymentStatus | ''
  method?: PaymentMethod | ''
  per_page?: number
}

export const formatMoney = (
  value: number | string | null | undefined,
  currency = 'USD',
): string => {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(numeric)) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric)
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

export const formatDateTime = (value?: string | null): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const employeeLabel = (employee?: EmployeeRef | null): string => {
  if (!employee) return '—'
  const name = employee.full_name?.trim() || 'Unknown'
  return employee.employee_code ? `${name} (${employee.employee_code})` : name
}
