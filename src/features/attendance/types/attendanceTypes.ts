import type { Paginated } from '@/features/employees/types/employeeTypes'

export type { Paginated }

export const ATTENDANCE_STATUSES = [
  'PRESENT',
  'ABSENT',
  'LATE',
  'PENDING_REVIEW',
] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  PENDING_REVIEW: 'Pending review',
}

export const OVERTIME_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const
export type OvertimeStatus = (typeof OVERTIME_STATUSES)[number]

export const OVERTIME_STATUS_LABELS: Record<OvertimeStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export const ADJUSTMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const
export type AdjustmentStatus = (typeof ADJUSTMENT_STATUSES)[number]

export const ADJUSTMENT_STATUS_LABELS: Record<AdjustmentStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export interface Shift {
  id: string
  name: string
  start_time: string
  end_time: string
  break_duration: number
  grace_period: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ShiftPayload {
  name: string
  start_time: string
  end_time: string
  break_duration?: number
  grace_period?: number
  is_active?: boolean
}

export interface ShiftAssignment {
  id: string
  employee_id: string
  shift_id: string
  start_date: string
  end_date: string | null
  created_at?: string
  updated_at?: string
  shift?: Pick<Shift, 'id' | 'name' | 'start_time' | 'end_time'> | null
}

export interface ShiftAssignmentPayload {
  employee_id: string
  shift_id: string
  start_date: string
  end_date?: string | null
}

export interface ShiftSchedule {
  id: string
  employee_id: string
  shift_id: string
  shop_id: string | null
  work_date: string
  is_rest_day: boolean
  created_at?: string
  updated_at?: string
  shift?: Pick<Shift, 'id' | 'name' | 'start_time' | 'end_time'> | null
}

export interface ShiftSchedulePayload {
  employee_id: string
  shift_id: string
  shop_id?: string | null
  work_date: string
  is_rest_day?: boolean
}

export interface GenerateShiftSchedulePayload {
  employee_id: string
  from: string
  to: string
  shop_id?: string | null
}

export interface AttendanceRecord {
  id: string
  employee_id: string
  shift_schedule_id: string | null
  check_in_time: string | null
  check_out_time: string | null
  worked_minutes: number | null
  lateness_minutes: number | null
  early_departure_minutes: number | null
  status: AttendanceStatus
  created_at?: string
  updated_at?: string
  employee?: {
    id: string
    full_name: string
    employee_code: string
  } | null
  shift_schedule?: Pick<ShiftSchedule, 'id' | 'work_date' | 'shift_id'> | null
}

export interface AttendanceReviewPayload {
  status: AttendanceStatus
  note?: string | null
}

export interface OvertimeRequest {
  id: string
  employee_id: string
  attendance_id: string | null
  requested_minutes: number
  approved_minutes: number | null
  reason: string | null
  status: OvertimeStatus
  approver_id: string | null
  created_at?: string
  updated_at?: string
  employee?: {
    id: string
    full_name: string
    employee_code: string
  } | null
}

export interface OvertimeRequestPayload {
  employee_id?: string | null
  attendance_id?: string | null
  requested_minutes: number
  reason?: string | null
}

export interface OvertimeReviewPayload {
  status: Extract<OvertimeStatus, 'APPROVED' | 'REJECTED'>
  approved_minutes?: number | null
}

export interface AttendanceAdjustment {
  id: string
  attendance_id: string
  original_check_in: string | null
  original_check_out: string | null
  corrected_check_in: string | null
  corrected_check_out: string | null
  reason: string
  reviewer_id: string | null
  status: AdjustmentStatus
  created_at?: string
  updated_at?: string
  attendance?: AttendanceRecord | null
}

export interface AttendanceAdjustmentPayload {
  corrected_check_in?: string | null
  corrected_check_out?: string | null
  reason: string
}

export interface AttendanceAdjustmentReviewPayload {
  status: Extract<AdjustmentStatus, 'APPROVED' | 'REJECTED'>
}

export interface AttendanceListParams {
  employee_id?: string
  status?: AttendanceStatus | ''
  shop_id?: string
  from?: string
  to?: string
  per_page?: number
}

export const formatMinutes = (minutes?: number | null): string => {
  if (minutes == null) return '—'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return `${hours}h ${rest}m`
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
