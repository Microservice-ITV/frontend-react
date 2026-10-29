import { useCallback, useEffect, useRef, useState } from 'react'
import { attendanceApi, attendanceErrorMessage } from '../api/attendanceApi'
import type {
  AttendanceAdjustment,
  AttendanceListParams,
  AttendanceRecord,
  OvertimeRequest,
  Paginated,
  Shift,
  ShiftAssignment,
  ShiftSchedule,
} from '../types/attendanceTypes'

const REFERENCE_PAGE_SIZE = 200

type Resource<T> = {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

const useResource = <T,>(loader: () => Promise<T>, key: string): Resource<T> => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await loaderRef.current())
    } catch (err) {
      setData(null)
      setError(attendanceErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, key])

  return { data, loading, error, reload: load }
}

export const useAttendanceRecords = (params?: AttendanceListParams) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<AttendanceRecord>>(
    () => attendanceApi.listAttendance(request).then((response) => response.data.data.attendance),
    JSON.stringify(request),
  )
  return {
    records: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useMyAttendanceRecords = (params?: AttendanceListParams) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<AttendanceRecord>>(
    () =>
      attendanceApi.listMyAttendance(request).then((response) => response.data.data.attendance),
    `me:${JSON.stringify(request)}`,
  )
  return {
    records: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useShifts = (params?: { search?: string; is_active?: boolean }) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<Shift>>(
    () => attendanceApi.listShifts(request).then((response) => response.data.data.shifts),
    JSON.stringify(request),
  )
  return {
    shifts: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useShiftAssignments = (params?: {
  employee_id?: string
  shift_id?: string
}) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<ShiftAssignment>>(
    () =>
      attendanceApi
        .listShiftAssignments(request)
        .then((response) => response.data.data.shift_assignments),
    JSON.stringify(request),
  )
  return {
    assignments: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useShiftSchedules = (params?: {
  employee_id?: string
  shift_id?: string
  from?: string
  to?: string
}) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<ShiftSchedule>>(
    () =>
      attendanceApi
        .listShiftSchedules(request)
        .then((response) => response.data.data.shift_schedules),
    JSON.stringify(request),
  )
  return {
    schedules: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useMyShiftSchedules = (params?: { from?: string; to?: string }) => {
  const request = { per_page: 31, ...params }
  const { data, loading, error, reload } = useResource<Paginated<ShiftSchedule>>(
    () =>
      attendanceApi
        .listMyShiftSchedules(request)
        .then((response) => response.data.data.shift_schedules),
    `me:${JSON.stringify(request)}`,
  )
  return {
    schedules: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useOvertimeRequests = (params?: {
  employee_id?: string
  status?: string
}) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<OvertimeRequest>>(
    () =>
      attendanceApi
        .listOvertimeRequests(request)
        .then((response) => response.data.data.overtime_requests),
    JSON.stringify(request),
  )
  return {
    requests: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useMyOvertimeRequests = (params?: { status?: string }) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<OvertimeRequest>>(
    () =>
      attendanceApi
        .listMyOvertimeRequests(request)
        .then((response) => response.data.data.overtime_requests),
    `me:${JSON.stringify(request)}`,
  )
  return {
    requests: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useAttendanceAdjustments = (params?: {
  attendance_id?: string
  status?: string
}) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<AttendanceAdjustment>>(
    () =>
      attendanceApi
        .listAttendanceAdjustments(request)
        .then((response) => response.data.data.attendance_adjustments),
    JSON.stringify(request),
  )
  return {
    adjustments: data?.data ?? [],
    loading,
    error,
    reload,
  }
}
