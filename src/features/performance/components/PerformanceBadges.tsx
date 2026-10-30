import StatusBadge, { type BadgeTone } from '@/components/ui/StatusBadge'
import {
  BONUS_AWARD_STATUS_LABELS,
  EMPLOYEE_GOAL_STATUS_LABELS,
  KPI_SCORING_METHOD_LABELS,
  PERFORMANCE_CYCLE_STATUS_LABELS,
  PERFORMANCE_PERIOD_TYPE_LABELS,
  PERFORMANCE_REVIEW_STATUS_LABELS,
  type BonusAwardStatus,
  type EmployeeGoalStatus,
  type KpiScoringMethod,
  type PerformanceCycleStatus,
  type PerformancePeriodType,
  type PerformanceReviewStatus,
} from '../types/performanceTypes'

export const PERFORMANCE_CYCLE_STATUS_TONES: Record<PerformanceCycleStatus, BadgeTone> = {
  DRAFT: 'neutral',
  ACTIVE: 'brand',
  UNDER_REVIEW: 'warning',
  CLOSED: 'info',
}
export const PERFORMANCE_REVIEW_STATUS_TONES: Record<PerformanceReviewStatus, BadgeTone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  EMPLOYEE_REVIEWED: 'info',
  FINALIZED: 'success',
}
export const EMPLOYEE_GOAL_STATUS_TONES: Record<EmployeeGoalStatus, BadgeTone> = {
  NOT_STARTED: 'neutral',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  MISSED: 'danger',
}
export const BONUS_AWARD_STATUS_TONES: Record<BonusAwardStatus, BadgeTone> = {
  PROPOSED: 'warning',
  APPROVED: 'brand',
  REJECTED: 'danger',
  PAID_VIA_PAYROLL: 'success',
}
export const KPI_SCORING_METHOD_TONES: Record<KpiScoringMethod, BadgeTone> = {
  BINARY: 'info',
  LINEAR: 'brand',
  MANUAL: 'warning',
}
export const PERFORMANCE_PERIOD_TYPE_TONES: Record<PerformancePeriodType, BadgeTone> = {
  MONTHLY: 'neutral',
  QUARTERLY: 'info',
  ANNUAL: 'brand',
}

export const PerformanceCycleStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: PerformanceCycleStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge label={PERFORMANCE_CYCLE_STATUS_LABELS[status]} tone={PERFORMANCE_CYCLE_STATUS_TONES[status]} size={size} />
)

export const PerformanceReviewStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: PerformanceReviewStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={PERFORMANCE_REVIEW_STATUS_LABELS[status]}
    tone={PERFORMANCE_REVIEW_STATUS_TONES[status]}
    size={size}
  />
)

export const EmployeeGoalStatusBadge = ({ status, size = 'sm' }: { status: EmployeeGoalStatus; size?: 'sm' | 'md' }) => (
  <StatusBadge label={EMPLOYEE_GOAL_STATUS_LABELS[status]} tone={EMPLOYEE_GOAL_STATUS_TONES[status]} size={size} />
)

export const BonusAwardStatusBadge = ({ status, size = 'sm' }: { status: BonusAwardStatus; size?: 'sm' | 'md' }) => (
  <StatusBadge label={BONUS_AWARD_STATUS_LABELS[status]} tone={BONUS_AWARD_STATUS_TONES[status]} size={size} />
)

export const KpiScoringMethodBadge = ({ method, size = 'sm' }: { method: KpiScoringMethod; size?: 'sm' | 'md' }) => (
  <StatusBadge label={KPI_SCORING_METHOD_LABELS[method]} tone={KPI_SCORING_METHOD_TONES[method]} size={size} />
)

export const PerformancePeriodTypeBadge = ({
  periodType,
  size = 'sm',
}: {
  periodType: PerformancePeriodType
  size?: 'sm' | 'md'
}) => (
  <StatusBadge label={PERFORMANCE_PERIOD_TYPE_LABELS[periodType]} tone={PERFORMANCE_PERIOD_TYPE_TONES[periodType]} size={size} />
)
