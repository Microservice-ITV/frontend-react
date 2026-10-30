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
import { useLeavePolicies, useLeaveTypes } from '../hooks/useLeaveData'
import {
  LEAVE_ACCRUAL_METHODS,
  LEAVE_ACCRUAL_METHOD_LABELS,
  formatDate,
  formatDays,
  type LeaveAccrualMethod,
  type LeavePolicy,
  type LeavePolicyPayload,
} from '../types/leaveTypes'

const LeavePoliciesPage = () => {
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const { leaveTypes } = useLeaveTypes({ is_active: true })
  const { leavePolicies, loading, error, reload } = useLeavePolicies({
    search: search || undefined,
    leave_type_id: typeFilter || undefined,
  })

  const openForm = (existing?: LeavePolicy) => {
    const payload: LeavePolicyPayload = {
      leave_type_id: existing?.leave_type_id ?? leaveTypes[0]?.id ?? '',
      name: existing?.name ?? '',
      entitlement_days: Number(existing?.entitlement_days ?? 0),
      accrual_method: existing?.accrual_method ?? 'UPFRONT',
      carry_forward_limit: Number(existing?.carry_forward_limit ?? 0),
      effective_from: existing?.effective_from?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      effective_to: existing?.effective_to?.slice(0, 10) ?? null,
    }

    showForm({
      title: existing ? 'Edit leave policy' : 'New leave policy',
      content: (
        <div className="grid gap-3">
          <FormField label="Leave type" required>
            <select
              defaultValue={payload.leave_type_id}
              onChange={(event) => {
                payload.leave_type_id = event.target.value
              }}
              className={textInputClass}
            >
              <option value="">Select a leave type</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Policy name" required>
            <input
              type="text"
              defaultValue={payload.name}
              onChange={(event) => {
                payload.name = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Entitlement days" required>
              <input
                type="number"
                min={0}
                max={365}
                step="0.5"
                defaultValue={payload.entitlement_days}
                onChange={(event) => {
                  payload.entitlement_days = Number(event.target.value)
                }}
                className={textInputClass}
              />
            </FormField>
            <FormField label="Accrual method">
              <select
                defaultValue={payload.accrual_method}
                onChange={(event) => {
                  payload.accrual_method = event.target.value as LeaveAccrualMethod
                }}
                className={textInputClass}
              >
                {LEAVE_ACCRUAL_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {LEAVE_ACCRUAL_METHOD_LABELS[method]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Carry forward limit">
              <input
                type="number"
                min={0}
                max={365}
                step="0.5"
                defaultValue={payload.carry_forward_limit}
                onChange={(event) => {
                  payload.carry_forward_limit = Number(event.target.value)
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
          </div>
        </div>
      ),
      primaryLabel: existing ? 'Save changes' : 'Create',
      onPrimary: async () => {
        try {
          if (existing) {
            await leaveApi.updateLeavePolicy(existing.id, payload)
          } else {
            await leaveApi.createLeavePolicy(payload)
          }
        } catch (err) {
          throw new Error(leaveErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const confirmDelete = (policy: LeavePolicy) => {
    openModal({
      title: 'Delete leave policy',
      content: (
        <p className="text-sm text-slate-600">
          Delete <span className="font-medium">{policy.name}</span>? This cannot be undone.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await leaveApi.deleteLeavePolicy(policy.id)
        } catch (err) {
          throw new Error(leaveErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<LeavePolicy>> = [
    {
      key: 'name',
      header: 'Policy',
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.leave_type?.name ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'entitlement',
      header: 'Entitlement',
      width: '140px',
      sortValue: (row) => Number(row.entitlement_days),
      render: (row) => formatDays(row.entitlement_days),
    },
    {
      key: 'accrual',
      header: 'Accrual',
      width: '150px',
      hideBelow: 'md',
      render: (row) => LEAVE_ACCRUAL_METHOD_LABELS[row.accrual_method] ?? row.accrual_method,
    },
    {
      key: 'carry',
      header: 'Carry forward',
      width: '140px',
      hideBelow: 'lg',
      render: (row) => formatDays(row.carry_forward_limit),
    },
    {
      key: 'effective',
      header: 'Effective',
      width: '200px',
      hideBelow: 'lg',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.effective_from)} → {row.effective_to ? formatDate(row.effective_to) : 'Open'}
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
          ariaLabel="Leave policy actions"
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
          <h1 className="text-xl font-bold text-slate-900">Leave Policies</h1>
          <p className="text-sm text-slate-500">
            Configure entitlements and accrual rules for each leave type.
          </p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={() => openForm()}>
          <Plus size={16} />
          New leave policy
        </button>
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search by policy name',
        }}
        selects={[
          {
            key: 'type',
            label: 'Leave type',
            value: typeFilter,
            allLabel: 'All types',
            onChange: setTypeFilter,
            options: leaveTypes.map((type) => ({ value: type.id, label: type.name })),
          },
        ]}
      />

      <DataTable<LeavePolicy>
        columns={columns}
        rows={leavePolicies}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No leave policies found."
        itemLabel="leave policies"
        minWidth="900px"
        fixedLayout
      />
    </div>
  )
}

export default LeavePoliciesPage
