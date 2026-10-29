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
import { useDesignations } from '../hooks/useEmployeeData'
import {
  REFERENCE_STATUSES,
  REFERENCE_STATUS_LABELS,
  type Designation,
  type DesignationPayload,
  type ReferenceStatus,
} from '../types/employeeTypes'

const DesignationsPage = () => {
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ReferenceStatus | ''>('')
  const { designations, loading, error, reload } = useDesignations()

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return designations.filter((designation) => {
      if (status && designation.status !== status) return false
      if (term && !designation.name.toLowerCase().includes(term)) return false
      return true
    })
  }, [designations, search, status])

  const openForm = (designation?: Designation) => {
    const payload: DesignationPayload = {
      name: designation?.name ?? '',
      status: designation?.status ?? 'active',
    }

    showForm({
      title: designation ? 'Edit designation' : 'New designation',
      content: (
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Name" required>
            <input
              defaultValue={payload.name}
              onChange={(event) => {
                payload.name = event.target.value
              }}
              className={textInputClass}
              placeholder="e.g. Junior, Senior, Lead"
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
        </div>
      ),
      primaryLabel: designation ? 'Save changes' : 'Create designation',
      onPrimary: async () => {
        if (!payload.name.trim()) {
          throw new Error('Enter a name for the designation.')
        }
        try {
          if (designation) {
            await employeeApi.updateDesignation(designation.id, payload)
          } else {
            await employeeApi.createDesignation(payload)
          }
        } catch (err) {
          throw new Error(employeeErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const confirmDelete = (designation: Designation) => {
    openModal({
      title: 'Delete designation?',
      content: (
        <p>
          Delete <strong>{designation.name}</strong>? This cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await employeeApi.deleteDesignation(designation.id)
        } catch (err) {
          throw new Error(employeeErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<Designation>> = [
    {
      key: 'name',
      header: 'Designation',
      sortValue: (row) => row.name,
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
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
          <h1 className="text-xl font-bold text-slate-900">Designations</h1>
          <p className="text-sm text-slate-500">
            Seniority levels employees can hold at a position, such as Junior, Senior or Lead.
          </p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={() => openForm()}>
          <Plus size={16} />
          Add designation
        </button>
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Search designations…' }}
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

      <DataTable<Designation>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No designations found."
        itemLabel="designations"
        minWidth="560px"
        fixedLayout
      />
    </div>
  )
}

export default DesignationsPage
