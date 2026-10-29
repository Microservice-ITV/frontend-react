export type AttendanceAreaBase = '/super-admin'

export const attendancePaths = (base: AttendanceAreaBase) => ({
  base,
  records: `${base}/attendance`,
  myAttendance: `${base}/attendance/me`,
  shifts: `${base}/shifts`,
  shiftSchedules: `${base}/shift-schedules`,
  overtimeRequests: `${base}/overtime-requests`,
})

export type AttendancePaths = ReturnType<typeof attendancePaths>
