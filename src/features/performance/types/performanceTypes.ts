import type { Paginated } from '@/features/employees/types/employeeTypes'

export type { Paginated }

// ---------------------------------------------------------------------------
// Enum-like constants + labels (mirrors backend App\Enums)
// ---------------------------------------------------------------------------

export const PERFORMANCE_CYCLE_STATUSES = ['DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'CLOSED'] as const
export type PerformanceCycleStatus = (typeof PERFORMANCE_CYCLE_STATUSES)[number]
export const PERFORMANCE_CYCLE_STATUS_LABELS: Record<PerformanceCycleStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  UNDER_REVIEW: 'Under review',
  CLOSED: 'Closed',
}

export const PERFORMANCE_PERIOD_TYPES = ['MONTHLY', 'QUARTERLY', 'ANNUAL'] as const
export type PerformancePeriodType = (typeof PERFORMANCE_PERIOD_TYPES)[number]
export const PERFORMANCE_PERIOD_TYPE_LABELS: Record<PerformancePeriodType, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Annual',
}

export const KPI_SCORING_METHODS = ['BINARY', 'LINEAR', 'MANUAL'] as const
export type KpiScoringMethod = (typeof KPI_SCORING_METHODS)[number]
export const KPI_SCORING_METHOD_LABELS: Record<KpiScoringMethod, string> = {
  BINARY: 'Binary',
  LINEAR: 'Linear',
  MANUAL: 'Manual',
}

export const PERFORMANCE_REVIEW_STATUSES = ['DRAFT', 'SUBMITTED', 'EMPLOYEE_REVIEWED', 'FINALIZED'] as const
export type PerformanceReviewStatus = (typeof PERFORMANCE_REVIEW_STATUSES)[number]
export const PERFORMANCE_REVIEW_STATUS_LABELS: Record<PerformanceReviewStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  EMPLOYEE_REVIEWED: 'Employee reviewed',
  FINALIZED: 'Finalized',
}

export const EMPLOYEE_GOAL_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'MISSED'] as const
export type EmployeeGoalStatus = (typeof EMPLOYEE_GOAL_STATUSES)[number]
export const EMPLOYEE_GOAL_STATUS_LABELS: Record<EmployeeGoalStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  MISSED: 'Missed',
}

export const BONUS_AWARD_STATUSES = ['PROPOSED', 'APPROVED', 'REJECTED', 'PAID_VIA_PAYROLL'] as const
export type BonusAwardStatus = (typeof BONUS_AWARD_STATUSES)[number]
export const BONUS_AWARD_STATUS_LABELS: Record<BonusAwardStatus, string> = {
  PROPOSED: 'Proposed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAID_VIA_PAYROLL: 'Paid via payroll',
}

// ---------------------------------------------------------------------------
// DTOs (mirrors backend models / eager-loaded relations)
// ---------------------------------------------------------------------------

export interface EmployeeRef {
  id: string
  full_name: string
  employee_code?: string | null
}

export interface PositionRef {
  id: string
  title: string
}

export interface Kpi {
  id: string
  title: string
  description?: string | null
  measurement_unit?: string | null
  scoring_method: KpiScoringMethod
  is_active: boolean
}

export interface PerformanceCycleKpi {
  id: string
  performance_cycle_id: string
  kpi_id: string
  position_id?: string | null
  target_value?: string | number | null
  weight_percentage: string | number
  kpi?: Kpi | null
  position?: PositionRef | null
}

export interface PerformanceCycle {
  id: string
  name: string
  period_type: PerformancePeriodType
  start_date: string
  end_date: string
  status: PerformanceCycleStatus
  created_at?: string
  cycle_kpis?: PerformanceCycleKpi[]
}

export interface PerformanceReviewKpi {
  id: string
  performance_review_id: string
  kpi_id: string
  actual_value?: string | number | null
  score?: string | number | null
  evidence_reference?: string | null
  kpi?: Kpi | null
}

export interface PerformanceReview {
  id: string
  employee_id: string
  performance_cycle_id: string
  reviewer_user_id?: string | null
  overall_weighted_score?: string | number | null
  manager_feedback?: string | null
  employee_comments?: string | null
  status: PerformanceReviewStatus
  created_at?: string
  employee?: EmployeeRef | null
  performance_cycle?: PerformanceCycle | null
  kpi_scores?: PerformanceReviewKpi[]
  bonus_award?: BonusAward | null
}

export interface EmployeeGoal {
  id: string
  employee_id: string
  performance_cycle_id: string
  title: string
  target_value?: string | number | null
  due_date?: string | null
  progress_percentage?: string | number | null
  status: EmployeeGoalStatus
  employee?: EmployeeRef | null
  performance_cycle?: PerformanceCycle | null
}

export interface BonusPolicy {
  id: string
  name: string
  min_performance_score?: string | number | null
  bonus_percentage_or_flat: string | number
  is_percentage: boolean
  effective_from: string
  effective_to?: string | null
  created_at?: string
}

export interface BonusAward {
  id: string
  employee_id: string
  performance_review_id: string
  bonus_policy_id: string
  proposed_amount: string | number
  approved_amount?: string | number | null
  status: BonusAwardStatus
  approved_by_user_id?: string | null
  created_at?: string
  employee?: EmployeeRef | null
  performance_review?: PerformanceReview | null
  bonus_policy?: BonusPolicy | null
}

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------

export interface PerformanceCyclePayload {
  name: string
  period_type: PerformancePeriodType
  start_date: string
  end_date: string
}

export interface CycleKpiPayload {
  kpi_id: string
  position_id?: string | null
  target_value?: number | null
  weight_percentage: number
}

export interface KpiPayload {
  title: string
  description?: string | null
  measurement_unit?: string | null
  scoring_method?: KpiScoringMethod
  is_active?: boolean
}

export interface EmployeeGoalPayload {
  employee_id: string
  performance_cycle_id: string
  title: string
  target_value?: number | null
  due_date?: string | null
}

export interface ReviewScorePayload {
  kpi_id: string
  actual_value?: number | null
  score?: number | null
  evidence_reference?: string | null
}

export interface BonusPolicyPayload {
  name: string
  min_performance_score?: number | null
  bonus_percentage_or_flat: number
  is_percentage?: boolean
  effective_from: string
  effective_to?: string | null
}

export interface PerformanceCycleListParams {
  status?: string
  period_type?: string
  from?: string
  to?: string
  search?: string
  per_page?: number
}

export interface PerformanceReviewListParams {
  employee_id?: string
  performance_cycle_id?: string
  status?: string
  per_page?: number
}

export interface BonusAwardListParams {
  employee_id?: string
  status?: string
  performance_cycle_id?: string
  per_page?: number
}

export interface EmployeeGoalListParams {
  employee_id?: string
  performance_cycle_id?: string
  status?: string
  per_page?: number
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export const formatScore = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(1) : '—'
}

export const formatWeight = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n) ? `${n % 1 === 0 ? n : n.toFixed(1)}%` : '—'
}

export const formatMoney = (value: string | number | null | undefined, currency = 'USD'): string => {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n)
}

export const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const employeeLabel = (employee?: EmployeeRef | null): string => {
  if (!employee) return '—'
  return employee.employee_code
    ? `${employee.full_name} (${employee.employee_code})`
    : employee.full_name
}
