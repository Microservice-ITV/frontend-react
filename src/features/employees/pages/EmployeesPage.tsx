import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import { employeeApi, employeeErrorMessage } from '../api/employeeApi'
import { EmployeeStatusBadge } from '../components/EmployeeStatusBadge'
import { primaryButtonClass } from '../components/forms/FormField'
import { employeePaths, type EmployeeAreaBase } from '../config/employeePaths'
import { useDepartments, useEmployees } from '../hooks/useEmployeeData'
import {
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  employeeDisplayName,
  type Employee,
  type EmploymentStatus,
  type EmploymentType,
} from '../types/employeeTypes'

export type EmployeesPageProps = {
  base: EmployeeAreaBase
}

const EmployeesPage = ({ base }: EmployeesPageProps) => {
  const paths = employeePaths(base)
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<EmploymentStatus | ''>('')
  const [type, setType] = useState<EmploymentType | ''>('')
  const [departmentId, setDepartmentId] = useState('')
  const { employees, loading, error, reload } = useEmployees()
  const { departments } = useDepartments()

  const departmentNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const department of departments) map[department.id] = department.name
    return map
  }, [departments])
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return employees.filter((employee) => {
      if (status && employee.employment_status !== status) return false
      if (type && employee.employment_type !== type) return false
      if (departmentId && employee.department_id !== departmentId) return false
      if (term) {
        const haystack = [
          employeeDisplayName(employee),
          employee.employee_code,
          employee.email ?? '',
          employee.phone ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [employees, search, status, type, departmentId])

  const confirmDelete = (employee: Employee) => {
    openModal({
      title: 'Delete employee?',
      content: (
        <p>
          Are you sure you want to delete{' '}
          <strong>{employeeDisplayName(employee)}</strong>? This cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      secondaryLabel: 'Cancel',
      onPrimary: async () => {
        try {
          await employeeApi.deleteEmployee(employee.id)
        } catch (err) {
          throw new Error(employeeErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<Employee>> = [
    {
      key: 'name',
      header: 'Employee',
      sortValue: (row) => employeeDisplayName(row),
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{employeeDisplayName(row)}</p>
          <p className="truncate text-xs text-slate-400" title={row.email ?? ''}>
            {row.employee_code}
            {row.email ? ` · ${row.email}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      width: '180px',
      hideBelow: 'md',
      sortValue: (row) => (row.department_id ? departmentNames[row.department_id] ?? '' : ''),
      render: (row) => (
        <span className="text-sm text-slate-700">
          {row.department?.name ?? (row.department_id ? departmentNames[row.department_id] ?? '—' : '—')}
        </span>
      ),
    },
    {
      key: 'position',
      header: 'Position',
      width: '180px',
      hideBelow: 'lg',
      sortValue: (row) => row.position?.title ?? '',
      render: (row) => (
        <span className="text-sm text-slate-700">{row.position?.title ?? '—'}</span>
      ),
    },
    {
      key: 'designation',
      header: 'Designation',
      width: '200px',
      hideBelow: 'xl',
      sortValue: (row) => row.designation?.name ?? '',
      render: (row) => <span className="text-sm text-slate-700">{row.designation?.name ?? '—'}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      width: '130px',
      hideBelow: 'lg',
      sortValue: (row) => row.employment_type,
      render: (row) => (
        <span className="text-sm text-slate-700">
          {EMPLOYMENT_TYPE_LABELS[row.employment_type]}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      sortValue: (row) => row.employment_status,
      render: (row) => <EmployeeStatusBadge status={row.employment_status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) => (
        <RowActionMenu
          ariaLabel={`Actions for ${employeeDisplayName(row)}`}
          items={[
            {
              key: 'view',
              label: 'View',
              icon: <Eye size={16} className="shrink-0 text-slate-500" />,
              onClick: () => navigate(paths.employeeDetail(row.id)),
            },
            {
              key: 'edit',
              label: 'Edit',
              icon: <Pencil size={16} className="shrink-0 text-slate-500" />,
              onClick: () => navigate(paths.employeeEdit(row.id)),
            },
            {
              key: 'delete',
              label: 'Delete',
              icon: <Trash2 size={16} className="shrink-0 text-red-500" />,
              className: 'flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer',
              onClick: () => confirmDelete(row),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-500">
        <Link to={paths.root} className="hover:text-slate-700">
          HR
        </Link>{' '}
        <span className="mx-1">/</span>
        <span className="text-slate-700">Employees</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500">
            Manage employee records, assignments, and employment status.
          </p>
        </div>
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => navigate(paths.employeeNew)}
        >
          <Plus size={16} />
          Add employee
        </button>
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search name, code, email…',
        }}
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
            onChange: (value) => setStatus(value as EmploymentStatus | ''),
            options: EMPLOYMENT_STATUSES.map((option) => ({
              value: option,
              label: EMPLOYMENT_STATUS_LABELS[option],
            })),
          },
          {
            key: 'type',
            label: 'Type',
            value: type,
            allLabel: 'All types',
            onChange: (value) => setType(value as EmploymentType | ''),
            options: EMPLOYMENT_TYPES.map((option) => ({
              value: option,
              label: EMPLOYMENT_TYPE_LABELS[option],
            })),
          },
        ]}
      />

      <DataTable<Employee>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No employees found."
        itemLabel="employees"
        minWidth="980px"
        fixedLayout
      />
    </div>
  )
}

export default EmployeesPage
