import { useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, ClipboardCheck, XCircle } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import {
  FormField,
  secondaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { useEmployees } from '@/features/employees/hooks/useEmployeeData'
import { employeeDisplayName } from '@/features/employees/types/employeeTypes'
import { attendanceApi, attendanceErrorMessage } from '../api/attendanceApi'
import { AdjustmentStatusBadge, AttendanceStatusBadge } from '../components/AttendanceBadges'
import { useAttendanceAdjustments, useAttendanceRecords } from '../hooks/useAttendanceData'
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABELS,
  employeeLabel,
  formatDate,
  formatDateTime,
  formatMinutes,
  type AttendanceAdjustment,
  type AttendanceRecord,
  type AttendanceStatus,
} from '../types/attendanceTypes'

type Tab = 'records' | 'adjustments'

const AttendanceRecordsPage = () => {
  const { openModal } = useGlobalModal()
  const [tab, setTab] = useState<Tab>('records')
  const [employeeId, setEmployeeId] = useState('')
  const [status, setStatus] = useState<AttendanceStatus | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { records, loading, error, reload } = useAttendanceRecords({
    employee_id: employeeId || undefined,
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
  })
  const { employees } = useEmployees()
  const {
    adjustments,
    loading: adjustmentsLoading,
    error: adjustmentsError,
    reload: reloadAdjustments,
  } = useAttendanceAdjustments()

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee.id,
        label: `${employeeDisplayName(employee)} (${employee.employee_code})`,
      })),
    [employees],
  )

  const openReview = (record: AttendanceRecord) => {
    const payload: { status: AttendanceStatus; note: string } = {
      status: record.status,
      note: '',
    }

    openModal({
      title: 'Review attendance',
      content: (
        <div className="grid gap-3">
          <p className="text-sm text-slate-500">
            {employeeLabel(record.employee)} · {formatDate(record.check_in_time)}
          </p>
          <FormField label="Status" required>
            <select
              defaultValue={payload.status}
              onChange={(event) => {
                payload.status = event.target.value as AttendanceStatus
              }}
              className={textInputClass}
            >
              {ATTENDANCE_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {ATTENDANCE_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Note">
            <textarea
              rows={3}
              onChange={(event) => {
                payload.note = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
        </div>
      ),
      primaryLabel: 'Save review',
      onPrimary: async () => {
        try {
          await attendanceApi.reviewAttendance(record.id, {
            status: payload.status,
            note: payload.note || null,
          })
        } catch (err) {
          throw new Error(attendanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const openAdjust = (record: AttendanceRecord) => {
    const payload: {
      corrected_check_in: string
      corrected_check_out: string
      reason: string
    } = {
      corrected_check_in: '',
      corrected_check_out: '',
      reason: '',
    }

    openModal({
      title: 'Request attendance adjustment',
      content: (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 text-sm text-slate-500">
            {employeeLabel(record.employee)} · {formatDate(record.check_in_time)}
            <br />
            Current: {formatDateTime(record.check_in_time)} →{' '}
            {formatDateTime(record.check_out_time)}
          </div>
          <FormField label="Corrected check-in">
            <input
              type="datetime-local"
              onChange={(event) => {
                payload.corrected_check_in = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Corrected check-out">
            <input
              type="datetime-local"
              onChange={(event) => {
                payload.corrected_check_out = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Reason" required className="sm:col-span-2">
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
      primaryLabel: 'Submit adjustment',
      onPrimary: async () => {
        try {
          await attendanceApi.createAttendanceAdjustment(record.id, {
            corrected_check_in: payload.corrected_check_in || null,
            corrected_check_out: payload.corrected_check_out || null,
            reason: payload.reason,
          })
        } catch (err) {
          throw new Error(attendanceErrorMessage(err))
        }
        await reload()
        await reloadAdjustments()
      },
    })
  }

  const reviewAdjustment = async (
    adjustment: AttendanceAdjustment,
    next: 'APPROVED' | 'REJECTED',
  ) => {
    try {
      await attendanceApi.reviewAttendanceAdjustment(adjustment.id, { status: next })
    } catch (err) {
      throw new Error(attendanceErrorMessage(err))
    }
    await reloadAdjustments()
    await reload()
  }

  const recordColumns: Array<DataTableColumn<AttendanceRecord>> = [
    {
      key: 'employee',
      header: 'Employee',
      sortValue: (row) => row.employee?.full_name ?? '',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">
            {row.employee?.full_name ?? '—'}
          </p>
          <p className="text-xs text-slate-400">{row.employee?.employee_code ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      width: '140px',
      sortValue: (row) => row.shift_schedule?.work_date ?? row.check_in_time ?? '',
      render: (row) => (
        <span className="text-sm text-slate-700">
          {formatDate(row.shift_schedule?.work_date ?? row.check_in_time)}
        </span>
      ),
    },
    {
      key: 'checkIn',
      header: 'Check in',
      width: '150px',
      hideBelow: 'md',
      render: (row) => (
        <span className="text-sm text-slate-700">{formatDateTime(row.check_in_time)}</span>
      ),
    },
    {
      key: 'checkOut',
      header: 'Check out',
      width: '150px',
      hideBelow: 'lg',
      render: (row) => (
        <span className="text-sm text-slate-700">{formatDateTime(row.check_out_time)}</span>
      ),
    },
    {
      key: 'worked',
      header: 'Worked',
      width: '110px',
      hideBelow: 'lg',
      sortValue: (row) => row.worked_minutes ?? 0,
      render: (row) => formatMinutes(row.worked_minutes),
    },
    {
      key: 'lateness',
      header: 'Late',
      width: '100px',
      hideBelow: 'xl',
      sortValue: (row) => row.lateness_minutes ?? 0,
      render: (row) => formatMinutes(row.lateness_minutes),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      sortValue: (row) => row.status,
      render: (row) => <AttendanceStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) => (
        <RowActionMenu
          ariaLabel={`Actions for ${row.employee?.full_name ?? 'record'}`}
          items={[
            {
              key: 'review',
              label: 'Review',
              icon: <ClipboardCheck size={16} className="shrink-0 text-slate-500" />,
              onClick: () => openReview(row),
            },
            {
              key: 'adjust',
              label: 'Adjust times',
              icon: <CalendarClock size={16} className="shrink-0 text-slate-500" />,
              onClick: () => openAdjust(row),
            },
          ]}
        />
      ),
    },
  ]

  const adjustmentColumns: Array<DataTableColumn<AttendanceAdjustment>> = [
    {
      key: 'employee',
      header: 'Employee',
      sortValue: (row) => row.attendance?.employee?.full_name ?? '',
      render: (row) => (
        <span className="text-sm text-slate-900">
          {row.attendance?.employee?.full_name ?? '—'}
        </span>
      ),
    },
    {
      key: 'original',
      header: 'Original',
      hideBelow: 'md',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {formatDateTime(row.original_check_in)} → {formatDateTime(row.original_check_out)}
        </span>
      ),
    },
    {
      key: 'corrected',
      header: 'Corrected',
      hideBelow: 'md',
      render: (row) => (
        <span className="text-xs text-slate-700">
          {formatDateTime(row.corrected_check_in)} → {formatDateTime(row.corrected_check_out)}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'lg',
      render: (row) => (
        <span className="line-clamp-2 text-xs text-slate-600" title={row.reason}>
          {row.reason}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      sortValue: (row) => row.status,
      render: (row) => <AdjustmentStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) =>
        row.status === 'PENDING' ? (
          <RowActionMenu
            ariaLabel="Adjustment actions"
            items={[
              {
                key: 'approve',
                label: 'Approve',
                icon: <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />,
                onClick: () => void reviewAdjustment(row, 'APPROVED'),
              },
              {
                key: 'reject',
                label: 'Reject',
                icon: <XCircle size={16} className="shrink-0 text-rose-600" />,
                className:
                  'flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer',
                onClick: () => void reviewAdjustment(row, 'REJECTED'),
              },
            ]}
          />
        ) : null,
    },
  ]

  const tabButton = (value: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      className={
        tab === value
          ? 'rounded-lg bg-[var(--dni-primary)] px-3 py-1.5 text-sm font-medium text-white'
          : 'rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100'
      }
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">
          Review daily attendance, resolve exceptions, and approve time adjustments.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {tabButton('records', 'Records')}
        {tabButton('adjustments', 'Adjustments')}
      </div>

      {tab === 'records' && (
        <>
          <FilterBar
            selects={[
              {
                key: 'employee',
                label: 'Employee',
                value: employeeId,
                allLabel: 'All employees',
                onChange: setEmployeeId,
                options: employeeOptions,
              },
              {
                key: 'status',
                label: 'Status',
                value: status,
                allLabel: 'All statuses',
                onChange: (value) => setStatus(value as AttendanceStatus | ''),
                options: ATTENDANCE_STATUSES.map((option) => ({
                  value: option,
                  label: ATTENDANCE_STATUS_LABELS[option],
                })),
              },
            ]}
            dateRange={{ from, to, onFromChange: setFrom, onToChange: setTo }}
          />

          <DataTable<AttendanceRecord>
            columns={recordColumns}
            rows={records}
            rowKey={(row) => row.id}
            loading={loading}
            error={error}
            emptyMessage="No attendance records found."
            itemLabel="records"
            minWidth="980px"
            fixedLayout
          />
        </>
      )}

      {tab === 'adjustments' && (
        <>
          <DataTable<AttendanceAdjustment>
            columns={adjustmentColumns}
            rows={adjustments}
            rowKey={(row) => row.id}
            loading={adjustmentsLoading}
            error={adjustmentsError}
            emptyMessage="No adjustment requests found."
            itemLabel="adjustments"
            minWidth="980px"
            fixedLayout
          />
          <div className="flex justify-end">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => void reloadAdjustments()}
            >
              Refresh
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default AttendanceRecordsPage
