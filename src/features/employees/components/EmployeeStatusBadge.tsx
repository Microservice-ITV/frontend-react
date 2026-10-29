import StatusBadge, { type BadgeTone } from '@/components/ui/StatusBadge'
import {
  CONTRACT_STATUS_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  REFERENCE_STATUS_LABELS,
  type ContractStatus,
  type EmploymentStatus,
  type ReferenceStatus,
} from '../types/employeeTypes'

export const EMPLOYMENT_STATUS_TONES: Record<EmploymentStatus, BadgeTone> = {
  active: 'success',
  probation: 'info',
  on_leave: 'warning',
  suspended: 'warning',
  resigned: 'neutral',
  terminated: 'danger',
}

export const CONTRACT_STATUS_TONES: Record<ContractStatus, BadgeTone> = {
  draft: 'neutral',
  active: 'success',
  expired: 'warning',
  terminated: 'danger',
}

export const REFERENCE_STATUS_TONES: Record<ReferenceStatus, BadgeTone> = {
  active: 'success',
  inactive: 'neutral',
}

export const EmployeeStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: EmploymentStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={EMPLOYMENT_STATUS_LABELS[status]}
    tone={EMPLOYMENT_STATUS_TONES[status]}
    size={size}
  />
)

export const ContractStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: ContractStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={CONTRACT_STATUS_LABELS[status]}
    tone={CONTRACT_STATUS_TONES[status]}
    size={size}
  />
)

export const ReferenceStatusBadge = ({
  status,
  size = 'sm',
}: {
  status: ReferenceStatus
  size?: 'sm' | 'md'
}) => (
  <StatusBadge
    label={REFERENCE_STATUS_LABELS[status]}
    tone={REFERENCE_STATUS_TONES[status]}
    size={size}
  />
)
