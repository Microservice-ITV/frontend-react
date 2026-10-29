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
import { useDepartments, useEmployees } from '../hooks/useEmployeeData'
import {
  REFERENCE_STATUSES,
  REFERENCE_STATUS_LABELS,
  employeeDisplayName,
  type Department,
  type DepartmentPayload,
  type ReferenceStatus,
} from '../types/employeeTypes'

const DepartmentsPage = () => {
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ReferenceStatus | ''>('')
  const { departments, loading, error, reload } = useDepartments()
  const { employees } = useEmployees()

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return departments.filter((department) => {
      if (status && department.status !== status) return false
      if (term) {
        const haystack = `${department.name} ${department.code}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [departments, search, status])

  const openForm = (department?: Department) => {
    const payload: DepartmentPayload = {
      code: department?.code ?? '',
      name: department?.name ?? '',
      parent_id: department?.parent_id ?? null,
      manager_employee_id: department?.manager_employee_id ?? null,
      description: department?.description ?? null,
      status: department?.status ?? 'active',
    }

    showForm({
      title: department ? 'Edit department' : 'New department',
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
          <FormField label="Name" required>
            <input
              defaultValue={payload.name}
              onChange={(event) => {
                payload.name = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Parent department">
            <select
              defaultValue={payload.parent_id ?? ''}
              onChange={(event) => {
                payload.parent_id = event.target.value || null
              }}
              className={textInputClass}
            >
              <option value="">None</option>
              {departments
                .filter((option) => option.id !== department?.id)
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
            </select>
          </FormField>
          <FormField label="Manager">
            <select
              defaultValue={payload.manager_employee_id ?? ''}
              onChange={(event) => {
                payload.manager_employee_id = event.target.value || null
              }}
              className={textInputClass}
            >
              <option value="">Unassigned</option>
              {employees.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {employeeDisplayName(manager)} ({manager.employee_code})
                </option>
              ))}
            </select>
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
      primaryLabel: department ? 'Save changes' : 'Create department',
      onPrimary: async () => {
        try {
          if (department) {
            await employeeApi.updateDepartment(department.id, payload)
          } else {
            await employeeApi.createDepartment(payload)
          }
        } catch (err) {
          throw new Error(employeeErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const confirmDelete = (department: Department) => {
    openModal({
      title: 'Delete department?',
      content: (
        <p>
          Delete <strong>{department.name}</strong>? This cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await employeeApi.deleteDepartment(department.id)
        } catch (err) {
          throw new Error(employeeErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<Department>> = [
    {
      key: 'name',
      header: 'Department',
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'parent',
      header: 'Parent',
      width: '180px',
      hideBelow: 'md',
      render: (row) => row.parent?.name ?? '—',
    },
    {
      key: 'manager',
      header: 'Manager',
      width: '180px',
      hideBelow: 'lg',
      render: (row) => row.manager?.full_name ?? '—',
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
          <h1 className="text-xl font-bold text-slate-900">Departments</h1>
          <p className="text-sm text-slate-500">Organizational units and their managers.</p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={() => openForm()}>
          <Plus size={16} />
          Add department
        </button>
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Search name or code…' }}
        selects={[
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

      <DataTable<Department>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No departments found."
        itemLabel="departments"
        minWidth="820px"
        fixedLayout
      />
    </div>
  )
}

export default DepartmentsPage
