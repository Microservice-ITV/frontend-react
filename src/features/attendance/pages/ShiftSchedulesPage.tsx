import { useMemo, useState } from 'react'
import { CalendarPlus, Trash2 } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import StatusBadge from '@/components/ui/StatusBadge'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import {
  FormField,
  primaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { useEmployeeStyleForm } from '@/features/employees/components/forms/useEmployeeStyleForm'
import {
  useEmployees,
} from '@/features/employees/hooks/useEmployeeData'
import { employeeDisplayName } from '@/features/employees/types/employeeTypes'
import { attendanceApi, attendanceErrorMessage } from '../api/attendanceApi'
import { useShiftSchedules, useShifts } from '../hooks/useAttendanceData'
import {
  formatDate,
  type ShiftSchedule,
} from '../types/attendanceTypes'

const ShiftSchedulesPage = () => {
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const [employeeId, setEmployeeId] = useState('')
  const [shiftId, setShiftId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { schedules, loading, error, reload } = useShiftSchedules({
    employee_id: employeeId || undefined,
    shift_id: shiftId || undefined,
    from: from || undefined,
    to: to || undefined,
  })
  const { shifts } = useShifts()
  const { employees } = useEmployees()

  const shiftNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const shift of shifts) map[shift.id] = shift.name
    return map
  }, [shifts])

  const openGenerate = () => {
    const payload: { employee_id: string; from: string; to: string } = {
      employee_id: employeeId || employees[0]?.id || '',
      from: from || new Date().toISOString().slice(0, 10),
      to: to || new Date().toISOString().slice(0, 10),
    }

    showForm({
      title: 'Generate shift schedules',
      content: (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Employee" required className="sm:col-span-2">
            <select
              defaultValue={payload.employee_id}
              onChange={(event) => {
                payload.employee_id = event.target.value
              }}
              className={textInputClass}
            >
              <option value="">Select an employee…</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employeeDisplayName(employee)} ({employee.employee_code})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="From" required>
            <input
              type="date"
              defaultValue={payload.from}
              onChange={(event) => {
                payload.from = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="To" required>
            <input
              type="date"
              defaultValue={payload.to}
              onChange={(event) => {
                payload.to = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
        </div>
      ),
      primaryLabel: 'Generate',
      onPrimary: async () => {
        try {
          await attendanceApi.generateShiftSchedules({
            employee_id: payload.employee_id,
            from: payload.from,
            to: payload.to,
          })
        } catch (err) {
          throw new Error(attendanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const confirmDelete = (schedule: ShiftSchedule) => {
    openModal({
      title: 'Delete shift schedule?',
      content: (
        <p>
          Remove the schedule on <strong>{formatDate(schedule.work_date)}</strong>? This
          cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await attendanceApi.deleteShiftSchedule(schedule.id)
        } catch (err) {
          throw new Error(attendanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<ShiftSchedule>> = [
    {
      key: 'date',
      header: 'Work date',
      width: '160px',
      sortValue: (row) => row.work_date,
      render: (row) => (
        <span className="font-medium text-slate-900">{formatDate(row.work_date)}</span>
      ),
    },
    {
      key: 'shift',
      header: 'Shift',
      sortValue: (row) => row.shift?.name ?? shiftNames[row.shift_id] ?? '',
      render: (row) => (
        <span className="text-sm text-slate-700">
          {row.shift?.name ?? shiftNames[row.shift_id] ?? '—'}
        </span>
      ),
    },
    {
      key: 'rest',
      header: 'Day type',
      width: '130px',
      hideBelow: 'md',
      render: (row) => (
        <StatusBadge
          label={row.is_rest_day ? 'Rest day' : 'Working'}
          tone={row.is_rest_day ? 'neutral' : 'brand'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) => (
        <RowActionMenu
          ariaLabel={`Actions for ${formatDate(row.work_date)}`}
          items={[
            {
              key: 'delete',
              label: 'Delete',
              icon: <Trash2 size={16} className="shrink-0 text-slate-500" />,
              className:
                'flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer',
              onClick: () => confirmDelete(row),
            },
          ]}
        />
      ),
    },
  ]

  if (formPage) return formPage

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Shift Schedules</h1>
          <p className="text-sm text-slate-500">
            Assign working days per employee and generate recurring schedules.
          </p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={openGenerate}>
          <CalendarPlus size={16} />
          Generate schedules
        </button>
      </div>

      <FilterBar
        selects={[
          {
            key: 'employee',
            label: 'Employee',
            value: employeeId,
            allLabel: 'All employees',
            onChange: setEmployeeId,
            options: employees.map((employee) => ({
              value: employee.id,
              label: `${employeeDisplayName(employee)} (${employee.employee_code})`,
            })),
          },
          {
            key: 'shift',
            label: 'Shift',
            value: shiftId,
            allLabel: 'All shifts',
            onChange: setShiftId,
            options: shifts.map((shift) => ({ value: shift.id, label: shift.name })),
          },
        ]}
        dateRange={{
          from,
          to,
          onFromChange: setFrom,
          onToChange: setTo,
        }}
      />

      <DataTable<ShiftSchedule>
        columns={columns}
        rows={schedules}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No shift schedules found."
        itemLabel="schedules"
        minWidth="760px"
        fixedLayout
      />
    </div>
  )
}

export default ShiftSchedulesPage
