import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import StatusBadge from '@/components/ui/StatusBadge'
import {
  FormField,
  primaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { useEmployeeStyleForm } from '@/features/employees/components/forms/useEmployeeStyleForm'
import { leaveApi, leaveErrorMessage } from '../api/leaveApi'
import { useCompanyPolicies } from '../hooks/useLeaveData'
import {
  COMPANY_POLICY_CATEGORIES,
  formatDate,
  type CompanyPolicy,
  type CompanyPolicyPayload,
} from '../types/leaveTypes'

const CATEGORY_LABELS: Record<string, string> = {
  LEAVE: 'Leave',
  ATTENDANCE: 'Attendance',
  PAYROLL: 'Payroll',
  GENERAL: 'General',
}

const CompanyPoliciesTab = () => {
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const { companyPolicies, loading, error, reload } = useCompanyPolicies({
    search: search || undefined,
    category: categoryFilter || undefined,
  })

  const openForm = (existing?: CompanyPolicy) => {
    const payload: CompanyPolicyPayload = {
      code: existing?.code ?? '',
      title: existing?.title ?? '',
      category: existing?.category ?? 'LEAVE',
      description: existing?.description ?? null,
      effective_from:
        existing?.effective_from?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      effective_to: existing?.effective_to?.slice(0, 10) ?? null,
      status: existing?.status ?? 'active',
    }

    showForm({
      title: existing ? 'Edit company policy' : 'New company policy',
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
          <FormField label="Category">
            <select
              defaultValue={payload.category}
              onChange={(event) => {
                payload.category = event.target.value
              }}
              className={textInputClass}
            >
              {COMPANY_POLICY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Title" required className="sm:col-span-2">
            <input
              defaultValue={payload.title}
              onChange={(event) => {
                payload.title = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Effective from" required>
            <input
              type="date"
              defaultValue={payload.effective_from}
              onChange={(event) => {
                payload.effective_from = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Effective to">
            <input
              type="date"
              defaultValue={payload.effective_to ?? ''}
              onChange={(event) => {
                payload.effective_to = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Status">
            <select
              defaultValue={payload.status}
              onChange={(event) => {
                payload.status = event.target.value as CompanyPolicyPayload['status']
              }}
              className={textInputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          <FormField label="Description" className="sm:col-span-2">
            <textarea
              rows={3}
              defaultValue={payload.description ?? ''}
              onChange={(event) => {
                payload.description = event.target.value || null
              }}
              className={textInputClass}
            />
          </FormField>
        </div>
      ),
      primaryLabel: existing ? 'Save changes' : 'Create',
      onPrimary: async () => {
        try {
          if (existing) {
            await leaveApi.updateCompanyPolicy(existing.id, payload)
          } else {
            await leaveApi.createCompanyPolicy(payload)
          }
        } catch (err) {
          throw new Error(leaveErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const confirmDelete = (policy: CompanyPolicy) => {
    openModal({
      title: 'Delete company policy',
      content: (
        <p className="text-sm text-slate-600">
          Delete <span className="font-medium">{policy.title}</span>? This cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await leaveApi.deleteCompanyPolicy(policy.id)
        } catch (err) {
          throw new Error(leaveErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<CompanyPolicy>> = [
    {
      key: 'title',
      header: 'Policy',
      sortValue: (row) => row.title,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.title}</p>
          <p className="text-xs text-slate-400">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      width: '140px',
      sortValue: (row) => row.category,
      render: (row) => CATEGORY_LABELS[row.category] ?? row.category,
    },
    {
      key: 'description',
      header: 'Description',
      hideBelow: 'lg',
      render: (row) => (
        <span className="line-clamp-2 text-xs text-slate-600">{row.description ?? '—'}</span>
      ),
    },
    {
      key: 'effective',
      header: 'Effective',
      width: '200px',
      hideBelow: 'md',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.effective_from)} → {row.effective_to ? formatDate(row.effective_to) : 'Open'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (row) => (
        <StatusBadge
          label={row.status === 'active' ? 'Active' : 'Inactive'}
          tone={row.status === 'active' ? 'success' : 'neutral'}
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
          ariaLabel="Company policy actions"
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
          <h2 className="text-base font-semibold text-slate-900">Company Policies</h2>
          <p className="text-xs text-slate-500">
            Organization-wide leave and HR policy documents effective across the company.
          </p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={() => openForm()}>
          <Plus size={16} />
          New company policy
        </button>
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search by title or code',
        }}
        selects={[
          {
            key: 'category',
            label: 'Category',
            value: categoryFilter,
            allLabel: 'All categories',
            onChange: setCategoryFilter,
            options: COMPANY_POLICY_CATEGORIES.map((category) => ({
              value: category,
              label: CATEGORY_LABELS[category],
            })),
          },
        ]}
      />

      <DataTable<CompanyPolicy>
        columns={columns}
        rows={companyPolicies}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No company policies found."
        itemLabel="company policies"
        minWidth="900px"
        fixedLayout
      />
    </div>
  )
}

export default CompanyPoliciesTab
