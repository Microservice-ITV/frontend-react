import { useMemo, useState } from 'react'
import { LogIn, LogOut, Plus } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import {
  FormField,
  primaryButtonClass,
  secondaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { attendanceApi, attendanceErrorMessage } from '../api/attendanceApi'
import { AttendanceStatusBadge, OvertimeStatusBadge } from '../components/AttendanceBadges'
import {
  useMyAttendanceRecords,
  useMyOvertimeRequests,
  useMyShiftSchedules,
} from '../hooks/useAttendanceData'
import {
  formatDate,
  formatDateTime,
  formatMinutes,
  type AttendanceRecord,
  type OvertimeRequest,
  type ShiftSchedule,
} from '../types/attendanceTypes'

const MyAttendancePage = () => {
  const { openModal } = useGlobalModal()
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const {
    records,
    loading: recordsLoading,
    error: recordsError,
    reload: reloadRecords,
  } = useMyAttendanceRecords()
  const {
    schedules,
    loading: schedulesLoading,
    error: schedulesError,
  } = useMyShiftSchedules()
  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    reload: reloadRequests,
  } = useMyOvertimeRequests()

  const openRecord = useMemo(
    () => records.find((record) => !record.check_out_time) ?? null,
    [records],
  )

  const today = new Date().toISOString().slice(0, 10)
  const todaysSchedule = useMemo(
    () => schedules.find((schedule) => schedule.work_date?.slice(0, 10) === today) ?? null,
    [schedules, today],
  )

  const handleCheckIn = async () => {
    setBusy(true)
    setActionError(null)
    try {
      await attendanceApi.checkInMe({ shift_schedule_id: todaysSchedule?.id ?? null })
      await reloadRecords()
    } catch (err) {
      setActionError(attendanceErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleCheckOut = async () => {
    setBusy(true)
    setActionError(null)
    try {
      await attendanceApi.checkOutMe()
      await reloadRecords()
    } catch (err) {
      setActionError(attendanceErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const openOvertimeRequest = () => {
    const payload = { requested_minutes: 60, reason: '' }
    openModal({
      title: 'Request overtime',
      content: (
        <div className="grid gap-3">
          <FormField label="Requested minutes" required>
            <input
              type="number"
              min={1}
              max={1440}
              defaultValue={payload.requested_minutes}
              onChange={(event) => {
                payload.requested_minutes = Number(event.target.value)
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Reason">
            <textarea
              rows={3}
              onChange={(event) => {
                payload.reason = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
        </div>
      ),
      primaryLabel: 'Submit request',
      onPrimary: async () => {
        try {
          await attendanceApi.createMyOvertimeRequest({
            attendance_id: openRecord?.id ?? null,
            requested_minutes: payload.requested_minutes,
            reason: payload.reason || null,
          })
        } catch (err) {
          throw new Error(attendanceErrorMessage(err))
        }
        await reloadRequests()
      },
    })
  }

  const recordColumns: Array<DataTableColumn<AttendanceRecord>> = [
    {
      key: 'date',
      header: 'Date',
      width: '150px',
      sortValue: (row) => row.shift_schedule?.work_date ?? row.check_in_time ?? '',
      render: (row) => (
        <span className="font-medium text-slate-900">
          {formatDate(row.shift_schedule?.work_date ?? row.check_in_time)}
        </span>
      ),
    },
    {
      key: 'checkIn',
      header: 'Check in',
      hideBelow: 'md',
      render: (row) => formatDateTime(row.check_in_time),
    },
    {
      key: 'checkOut',
      header: 'Check out',
      hideBelow: 'md',
      render: (row) => formatDateTime(row.check_out_time),
    },
    {
      key: 'worked',
      header: 'Worked',
      width: '110px',
      sortValue: (row) => row.worked_minutes ?? 0,
      render: (row) => formatMinutes(row.worked_minutes),
    },
    {
      key: 'lateness',
      header: 'Late',
      width: '100px',
      hideBelow: 'lg',
      render: (row) => formatMinutes(row.lateness_minutes),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      sortValue: (row) => row.status,
      render: (row) => <AttendanceStatusBadge status={row.status} />,
    },
  ]

  const scheduleColumns: Array<DataTableColumn<ShiftSchedule>> = [
    {
      key: 'date',
      header: 'Work date',
      width: '170px',
      sortValue: (row) => row.work_date,
      render: (row) => (
        <span className="font-medium text-slate-900">{formatDate(row.work_date)}</span>
      ),
    },
    {
      key: 'shift',
      header: 'Shift',
      render: (row) => row.shift?.name ?? '—',
    },
    {
      key: 'type',
      header: 'Day type',
      width: '130px',
      render: (row) => (row.is_rest_day ? 'Rest day' : 'Working'),
    },
  ]

  const overtimeColumns: Array<DataTableColumn<OvertimeRequest>> = [
    {
      key: 'requested',
      header: 'Requested',
      width: '130px',
      sortValue: (row) => row.requested_minutes,
      render: (row) => formatMinutes(row.requested_minutes),
    },
    {
      key: 'approved',
      header: 'Approved',
      width: '130px',
      hideBelow: 'md',
      render: (row) => formatMinutes(row.approved_minutes),
    },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'lg',
      render: (row) => (
        <span className="line-clamp-2 text-xs text-slate-600" title={row.reason ?? ''}>
          {row.reason ?? '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      sortValue: (row) => row.status,
      render: (row) => <OvertimeStatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Attendance</h1>
            <p className="text-sm text-slate-500">
              {openRecord
                ? `Checked in at ${formatDateTime(openRecord.check_in_time)}`
                : todaysSchedule
                  ? `Today's shift: ${todaysSchedule.shift?.name ?? 'Scheduled'}`
                  : 'You are not currently checked in.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={openOvertimeRequest}
            >
              <Plus size={16} />
              Request overtime
            </button>
            {openRecord ? (
              <button
                type="button"
                className={primaryButtonClass}
                disabled={busy}
                onClick={() => void handleCheckOut()}
              >
                <LogOut size={16} />
                Check out
              </button>
            ) : (
              <button
                type="button"
                className={primaryButtonClass}
                disabled={busy}
                onClick={() => void handleCheckIn()}
              >
                <LogIn size={16} />
                Check in
              </button>
            )}
          </div>
        </div>
        {actionError && <p className="mt-3 text-sm text-rose-600">{actionError}</p>}
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Recent attendance
        </h2>
        <DataTable<AttendanceRecord>
          columns={recordColumns}
          rows={records}
          rowKey={(row) => row.id}
          loading={recordsLoading}
          error={recordsError}
          emptyMessage="No attendance records yet."
          itemLabel="records"
          minWidth="760px"
          fixedLayout
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          My schedule
        </h2>
        <DataTable<ShiftSchedule>
          columns={scheduleColumns}
          rows={schedules}
          rowKey={(row) => row.id}
          loading={schedulesLoading}
          error={schedulesError}
          emptyMessage="No upcoming shifts scheduled."
          itemLabel="shifts"
          minWidth="620px"
          fixedLayout
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          My overtime requests
        </h2>
        <DataTable<OvertimeRequest>
          columns={overtimeColumns}
          rows={requests}
          rowKey={(row) => row.id}
          loading={requestsLoading}
          error={requestsError}
          emptyMessage="No overtime requests yet."
          itemLabel="requests"
          minWidth="620px"
          fixedLayout
        />
      </section>
    </div>
  )
}

export default MyAttendancePage
