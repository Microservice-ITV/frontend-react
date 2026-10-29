import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import {
  FormField,
  primaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { useEmployeeStyleForm } from '@/features/employees/components/forms/useEmployeeStyleForm'
import { leaveApi, leaveErrorMessage } from '../api/leaveApi'
import { useLeaveTypes } from '../hooks/useLeaveData'
import type { LeaveType, LeaveTypePayload } from '../types/leaveTypes'

const LeaveTypesPage = () => {
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('')
  const { leaveTypes, loading, error, reload } = useLeaveTypes({
    search: search || undefined,
    is_active: activeFilter === '' ? undefined : activeFilter === 'true',
  })

  const openForm = (existing?: LeaveType) => {
    const payload: LeaveTypePayload = {
      code: existing?.code ?? '',
      name: existing?.name ?? '',
      is_paid: existing?.is_paid ?? true,
      requires_document: existing?.requires_document ?? false,
      is_active: existing?.is_active ?? true,
    }

    showForm({
      title: existing ? 'Edit leave type' : 'New leave type',
      content: (
        <div className="grid gap-3">
          <FormField label="Code" required>
            <input
              type="text"
              defaultValue={payload.code}
              placeholder="e.g. ANNUAL"
              onChange={(event) => {
                payload.code = event.target.value.toUpperCase()
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Name" required>
            <input
              type="text"
              defaultValue={payload.name}
              onChange={(event) => {
                payload.name = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                defaultChecked={payload.is_paid}
                onChange={(event) => {
                  payload.is_paid = event.target.checked
                }}
              />
              Paid leave
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                defaultChecked={payload.requires_document}
                onChange={(event) => {
                  payload.requires_document = event.target.checked
                }}
              />
              Requires document
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                defaultChecked={payload.is_active}
                onChange={(event) => {
                  payload.is_active = event.target.checked
                }}
              />
              Active
            </label>
          </div>
        </div>
      ),
      primaryLabel: existing ? 'Save changes' : 'Create',
      onPrimary: async () => {
        try {
          if (existing) {
            await leaveApi.updateLeaveType(existing.id, payload)
          } else {
            await leaveApi.createLeaveType(payload)
          }
        } catch (err) {
          throw new Error(leaveErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const confirmDelete = (leaveType: LeaveType) => {
    openModal({
      title: 'Delete leave type',
      content: (
        <p className="text-sm text-slate-600">
          Delete <span className="font-medium">{leaveType.name}</span>? This cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await leaveApi.deleteLeaveType(leaveType.id)
        } catch (err) {
          throw new Error(leaveErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<LeaveType>> = [
    {
      key: 'code',
      header: 'Code',
      width: '140px',
      sortValue: (row) => row.code,
      render: (row) => <span className="font-medium text-slate-900">{row.code}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      sortValue: (row) => row.name,
      render: (row) => row.name,
    },
    {
      key: 'paid',
      header: 'Paid',
      width: '100px',
      render: (row) => (row.is_paid ? 'Paid' : 'Unpaid'),
    },
    {
      key: 'document',
      header: 'Document',
      width: '130px',
      hideBelow: 'md',
      render: (row) => (row.requires_document ? 'Required' : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (row) => (
        <span className={row.is_active ? 'text-emerald-600' : 'text-slate-400'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) => (
        <RowActionMenu
          ariaLabel="Leave type actions"
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
              icon: <Trash2 size={16} className="shrink-0 text-rose-600" />,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leave Types</h1>
          <p className="text-sm text-slate-500">Define the categories of leave employees can take.</p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={() => openForm()}>
          <Plus size={16} />
          New leave type
        </button>
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search by name or code',
        }}
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: activeFilter,
            allLabel: 'All statuses',
            onChange: (value) => setActiveFilter(value as '' | 'true' | 'false'),
            options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ],
          },
        ]}
      />

      <DataTable<LeaveType>
        columns={columns}
        rows={leaveTypes}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No leave types found."
        itemLabel="leave types"
        minWidth="820px"
        fixedLayout
      />
    </div>
  )
}

export default LeaveTypesPage
