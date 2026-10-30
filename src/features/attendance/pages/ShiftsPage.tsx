import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import StatusBadge from '@/components/ui/StatusBadge'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import { attendanceApi, attendanceErrorMessage } from '../api/attendanceApi'
import {
  FormField,
  primaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { useEmployeeStyleForm } from '@/features/employees/components/forms/useEmployeeStyleForm'
import { useShifts } from '../hooks/useAttendanceData'
import { formatMinutes, type Shift, type ShiftPayload } from '../types/attendanceTypes'

const toTime = (value: string) => {
  const match = value.match(/(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : value
}

const ShiftsPage = () => {
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const { shifts, loading, error, reload } = useShifts()

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return shifts.filter((shift) => {
      if (activeFilter === 'active' && !shift.is_active) return false
      if (activeFilter === 'inactive' && shift.is_active) return false
      if (term && !shift.name.toLowerCase().includes(term)) return false
      return true
    })
  }, [shifts, search, activeFilter])

  const openForm = (shift?: Shift) => {
    const payload: ShiftPayload = {
      name: shift?.name ?? '',
      start_time: shift ? toTime(shift.start_time) : '09:00',
      end_time: shift ? toTime(shift.end_time) : '17:00',
      break_duration: shift?.break_duration ?? 0,
      grace_period: shift?.grace_period ?? 0,
      is_active: shift?.is_active ?? true,
    }

    showForm({
      title: shift ? 'Edit shift' : 'New shift',
      content: (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Name" required className="sm:col-span-2">
            <input
              defaultValue={payload.name}
              onChange={(event) => {
                payload.name = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Start time" required>
            <input
              type="time"
              defaultValue={payload.start_time}
              onChange={(event) => {
                payload.start_time = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="End time" required>
            <input
              type="time"
              defaultValue={payload.end_time}
              onChange={(event) => {
                payload.end_time = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Break duration (minutes)">
            <input
              type="number"
              min={0}
              defaultValue={payload.break_duration}
              onChange={(event) => {
                payload.break_duration = Number(event.target.value)
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Grace period (minutes)">
            <input
              type="number"
              min={0}
              defaultValue={payload.grace_period}
              onChange={(event) => {
                payload.grace_period = Number(event.target.value)
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Active">
            <select
              defaultValue={payload.is_active ? 'true' : 'false'}
              onChange={(event) => {
                payload.is_active = event.target.value === 'true'
              }}
              className={textInputClass}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </FormField>
        </div>
      ),
      primaryLabel: shift ? 'Save changes' : 'Create shift',
      onPrimary: async () => {
        try {
          if (shift) {
            await attendanceApi.updateShift(shift.id, payload)
          } else {
            await attendanceApi.createShift(payload)
          }
        } catch (err) {
          throw new Error(attendanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const confirmDelete = (shift: Shift) => {
    openModal({
      title: 'Delete shift?',
      content: (
        <p>
          Delete <strong>{shift.name}</strong>? This cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await attendanceApi.deleteShift(shift.id)
        } catch (err) {
          throw new Error(attendanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<Shift>> = [
    {
      key: 'name',
      header: 'Shift',
      sortValue: (row) => row.name,
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      key: 'hours',
      header: 'Hours',
      width: '180px',
      sortValue: (row) => row.start_time,
      render: (row) => (
        <span className="text-sm text-slate-700">
          {toTime(row.start_time)} – {toTime(row.end_time)}
        </span>
      ),
    },
    {
      key: 'break',
      header: 'Break',
      width: '110px',
      hideBelow: 'md',
      render: (row) => formatMinutes(row.break_duration),
    },
    {
      key: 'grace',
      header: 'Grace',
      width: '110px',
      hideBelow: 'md',
      render: (row) => formatMinutes(row.grace_period),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      sortValue: (row) => (row.is_active ? 1 : 0),
      render: (row) => (
        <StatusBadge
          label={row.is_active ? 'Active' : 'Inactive'}
          tone={row.is_active ? 'success' : 'neutral'}
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
          ariaLabel={`Actions for ${row.name}`}
          items={[
            {
              key: 'edit',
              label: 'Edit',
              icon: <Pencil size={16} className="shrink-0 text-slate-500" />,
              onClick: () => openForm(row),
            },
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
          <h1 className="text-xl font-bold text-slate-900">Shifts</h1>
          <p className="text-sm text-slate-500">
            Define working hours, break durations, and grace periods.
          </p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={() => openForm()}>
          <Plus size={16} />
          Add shift
        </button>
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Search shift name…' }}
        selects={[
          {
            key: 'active',
            label: 'Status',
            value: activeFilter,
            allLabel: 'All shifts',
            onChange: setActiveFilter,
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ],
          },
        ]}
      />

      <DataTable<Shift>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No shifts found."
        itemLabel="shifts"
        minWidth="880px"
        fixedLayout
      />
    </div>
  )
}

export default ShiftsPage
