import type { AxiosError } from 'axios'
import { employeeClient } from '@/lib/api/employeeClient'
import type {
  AttendanceAdjustment,
  AttendanceAdjustmentPayload,
  AttendanceAdjustmentReviewPayload,
  AttendanceListParams,
  AttendanceRecord,
  AttendanceReviewPayload,
  GenerateShiftSchedulePayload,
  OvertimeRequest,
  OvertimeRequestPayload,
  OvertimeReviewPayload,
  Paginated,
  Shift,
  ShiftAssignment,
  ShiftAssignmentPayload,
  ShiftPayload,
  ShiftSchedule,
  ShiftSchedulePayload,
} from '../types/attendanceTypes'

type Envelope<T> = { success: boolean; data: T }

export const attendanceErrorMessage = (error: unknown): string => {
  const axiosError = error as AxiosError<{
    error?: { code?: string; message?: string }
    message?: string
    errors?: Record<string, string[]>
  }>
  const validation = axiosError.response?.data?.errors
  if (validation) {
    const first = Object.values(validation)[0]
    if (Array.isArray(first) && first.length > 0) return first[0]
  }
  return (
    axiosError.response?.data?.error?.message ??
    axiosError.response?.data?.message ??
    axiosError.message ??
    'Something went wrong'
  )
}

const cleanParams = (params?: Record<string, unknown>) => {
  if (!params) return undefined
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  )
  return Object.fromEntries(entries)
}

export const attendanceApi = {
  // --- Attendance records ---
  listAttendance(params?: AttendanceListParams) {
    return employeeClient.get<Envelope<{ attendance: Paginated<AttendanceRecord> }>>(
      '/attendance',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  listMyAttendance(params?: AttendanceListParams) {
    return employeeClient.get<Envelope<{ attendance: Paginated<AttendanceRecord> }>>(
      '/attendance/me',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  checkInMe(payload?: { shift_schedule_id?: string | null; at?: string | null }) {
    return employeeClient.post<Envelope<{ attendance: AttendanceRecord }>>(
      '/attendance/check-in/me',
      cleanParams(payload as Record<string, unknown>) ?? {},
    )
  },
  checkOutMe(payload?: { at?: string | null }) {
    return employeeClient.post<Envelope<{ attendance: AttendanceRecord }>>(
      '/attendance/check-out/me',
      cleanParams(payload as Record<string, unknown>) ?? {},
    )
  },
  reviewAttendance(id: string, payload: AttendanceReviewPayload) {
    return employeeClient.post<Envelope<{ attendance: AttendanceRecord }>>(
      `/attendance/${id}/review`,
      payload,
    )
  },

  // --- Shifts ---
  listShifts(params?: { search?: string; is_active?: boolean; per_page?: number }) {
    return employeeClient.get<Envelope<{ shifts: Paginated<Shift> }>>('/shifts', {
      params: cleanParams(params as Record<string, unknown>),
    })
  },
  createShift(payload: ShiftPayload) {
    return employeeClient.post<Envelope<{ shift: Shift }>>('/shifts', payload)
  },
  updateShift(id: string, payload: Partial<ShiftPayload>) {
    return employeeClient.put<Envelope<{ shift: Shift }>>(`/shifts/${id}`, payload)
  },
  deleteShift(id: string) {
    return employeeClient.delete<Envelope<{ message: string }>>(`/shifts/${id}`)
  },

  // --- Shift assignments ---
  listShiftAssignments(params?: {
    employee_id?: string
    shift_id?: string
    per_page?: number
  }) {
    return employeeClient.get<Envelope<{ shift_assignments: Paginated<ShiftAssignment> }>>(
      '/shift-assignments',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  createShiftAssignment(payload: ShiftAssignmentPayload) {
    return employeeClient.post<Envelope<{ shift_assignment: ShiftAssignment }>>(
      '/shift-assignments',
      payload,
    )
  },
  deleteShiftAssignment(id: string) {
    return employeeClient.delete<Envelope<{ message: string }>>(
      `/shift-assignments/${id}`,
    )
  },

  // --- Shift schedules ---
  listShiftSchedules(params?: {
    employee_id?: string
    shift_id?: string
    shop_id?: string
    from?: string
    to?: string
    per_page?: number
  }) {
    return employeeClient.get<Envelope<{ shift_schedules: Paginated<ShiftSchedule> }>>(
      '/shift-schedules',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  listMyShiftSchedules(params?: { from?: string; to?: string; per_page?: number }) {
    return employeeClient.get<Envelope<{ shift_schedules: Paginated<ShiftSchedule> }>>(
      '/shift-schedules/me',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  createShiftSchedule(payload: ShiftSchedulePayload) {
    return employeeClient.post<Envelope<{ shift_schedule: ShiftSchedule }>>(
      '/shift-schedules',
      payload,
    )
  },
  updateShiftSchedule(id: string, payload: Partial<ShiftSchedulePayload>) {
    return employeeClient.put<Envelope<{ shift_schedule: ShiftSchedule }>>(
      `/shift-schedules/${id}`,
      payload,
    )
  },
  deleteShiftSchedule(id: string) {
    return employeeClient.delete<Envelope<{ message: string }>>(
      `/shift-schedules/${id}`,
    )
  },
  generateShiftSchedules(payload: GenerateShiftSchedulePayload) {
    return employeeClient.post<Envelope<{ shift_schedules: ShiftSchedule[] }>>(
      '/shift-schedules/generate',
      payload,
    )
  },

  // --- Overtime requests ---
  listOvertimeRequests(params?: {
    employee_id?: string
    status?: string
    attendance_id?: string
    per_page?: number
  }) {
    return employeeClient.get<Envelope<{ overtime_requests: Paginated<OvertimeRequest> }>>(
      '/overtime-requests',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  listMyOvertimeRequests(params?: { status?: string; per_page?: number }) {
    return employeeClient.get<Envelope<{ overtime_requests: Paginated<OvertimeRequest> }>>(
      '/overtime-requests/me',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  createMyOvertimeRequest(payload: OvertimeRequestPayload) {
    return employeeClient.post<Envelope<{ overtime_request: OvertimeRequest }>>(
      '/overtime-requests/me',
      payload,
    )
  },
  reviewOvertimeRequest(id: string, payload: OvertimeReviewPayload) {
    return employeeClient.post<Envelope<{ overtime_request: OvertimeRequest }>>(
      `/overtime-requests/${id}/review`,
      payload,
    )
  },

  // --- Attendance adjustments ---
  listAttendanceAdjustments(params?: {
    attendance_id?: string
    status?: string
    per_page?: number
  }) {
    return employeeClient.get<
      Envelope<{ attendance_adjustments: Paginated<AttendanceAdjustment> }>
    >('/attendance-adjustments', { params: cleanParams(params as Record<string, unknown>) })
  },
  createAttendanceAdjustment(attendanceId: string, payload: AttendanceAdjustmentPayload) {
    return employeeClient.post<Envelope<{ attendance_adjustment: AttendanceAdjustment }>>(
      `/attendance/${attendanceId}/adjustments`,
      payload,
    )
  },
  reviewAttendanceAdjustment(
    id: string,
    payload: AttendanceAdjustmentReviewPayload,
  ) {
    return employeeClient.post<Envelope<{ attendance_adjustment: AttendanceAdjustment }>>(
      `/attendance-adjustments/${id}/review`,
      payload,
    )
  },
}
