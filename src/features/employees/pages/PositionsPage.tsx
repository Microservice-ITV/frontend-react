import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import { employeeApi, employeeErrorMessage } from '../api/employeeApi'
import { ReferenceStatusBadge } from '../components/EmployeeStatusBadge'
import {
  FormField,
  primaryButtonClass,
  textInputClass,
} from '../components/forms/FormField'
import { useEmployeeStyleForm } from '../components/forms/useEmployeeStyleForm'
import { useDepartments, usePositions } from '../hooks/useEmployeeData'
import {
  REFERENCE_STATUSES,
  REFERENCE_STATUS_LABELS,
  type Position,
  type PositionPayload,
  type ReferenceStatus,
} from '../types/employeeTypes'

const PositionsPage = () => {
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ReferenceStatus | ''>('')
  const [departmentId, setDepartmentId] = useState('')
  const { positions, loading, error, reload } = usePositions()
  const { departments } = useDepartments()

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return positions.filter((position) => {
      if (status && position.status !== status) return false
      if (departmentId && position.department_id !== departmentId) return false
      if (term) {
        const haystack = `${position.title} ${position.code}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [positions, search, status, departmentId])

  const openForm = (position?: Position) => {
    const payload: PositionPayload = {
      code: position?.code ?? '',
      title: position?.title ?? '',
      department_id: position?.department_id ?? departments[0]?.id ?? '',
      level: position?.level ?? null,
      description: position?.description ?? null,
      status: position?.status ?? 'active',
    }

    showForm({
      title: position ? 'Edit position' : 'New position',
      content: (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Code" required>
            <input
              defaultValue={payload.code}
              onChange={(event) => {
                payload.code = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Title" required>
            <input
              defaultValue={payload.title}
              onChange={(event) => {
                payload.title = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Department" required>
            <select
              defaultValue={payload.department_id}
              onChange={(event) => {
                payload.department_id = event.target.value
              }}
              className={textInputClass}
            >
              {departments.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Level">
            <input
              defaultValue={payload.level ?? ''}
              onChange={(event) => {
                payload.level = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Status">
            <select
              defaultValue={payload.status}
              onChange={(event) => {
                payload.status = event.target.value as ReferenceStatus
              }}
              className={textInputClass}
            >
              {REFERENCE_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {REFERENCE_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Description" className="sm:col-span-2">
            <textarea
              defaultValue={payload.description ?? ''}
              rows={2}
              onChange={(event) => {
                payload.description = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
        </div>
      ),
      primaryLabel: position ? 'Save changes' : 'Create position',
      onPrimary: async () => {
        if (!payload.department_id) {
          throw new Error('Select a department for the position.')
        }
        try {
          if (position) {
            await employeeApi.updatePosition(position.id, payload)
          } else {
            await employeeApi.createPosition(payload)
          }
        } catch (err) {
          throw new Error(employeeErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const confirmDelete = (position: Position) => {
    openModal({
      title: 'Delete position?',
      content: (
        <p>
          Delete <strong>{position.title}</strong>? This cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await employeeApi.deletePosition(position.id)
        } catch (err) {
          throw new Error(employeeErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<Position>> = [
    {
      key: 'title',
      header: 'Position',
      sortValue: (row) => row.title,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.title}</p>
          <p className="text-xs text-slate-400">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      width: '200px',
      hideBelow: 'md',
      render: (row) => row.department?.name ?? '—',
    },
    {
      key: 'level',
      header: 'Level',
      width: '120px',
      hideBelow: 'lg',
      render: (row) => row.level ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      sortValue: (row) => row.status,
      render: (row) => <ReferenceStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) => (
        <RowActionMenu
          ariaLabel={`Actions for ${row.title}`}
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
          <h1 className="text-xl font-bold text-slate-900">Positions</h1>
          <p className="text-sm text-slate-500">Job positions available across departments.</p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={() => openForm()}>
          <Plus size={16} />
          Add position
        </button>
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Search title or code…' }}
        selects={[
          {
            key: 'department',
            label: 'Department',
            value: departmentId,
            allLabel: 'All departments',
            onChange: setDepartmentId,
            options: departments.map((department) => ({
              value: department.id,
              label: department.name,
            })),
          },
          {
            key: 'status',
            label: 'Status',
            value: status,
            allLabel: 'All statuses',
            onChange: (value) => setStatus(value as ReferenceStatus | ''),
            options: REFERENCE_STATUSES.map((option) => ({
              value: option,
              label: REFERENCE_STATUS_LABELS[option],
            })),
          },
        ]}
      />

      <DataTable<Position>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No positions found."
        itemLabel="positions"
        minWidth="820px"
        fixedLayout
      />
    </div>
  )
}

export default PositionsPage
