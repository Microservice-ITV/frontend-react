import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import StatusBadge from '@/components/ui/StatusBadge'
import {
  FormField,
  primaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { useEmployeeStyleForm } from '@/features/employees/components/forms/useEmployeeStyleForm'
import { usePositions } from '@/features/employees/hooks/useEmployeeData'
import { leaveApi, leaveErrorMessage } from '../api/leaveApi'
import { useLeavePolicies, usePositionLeavePolicies } from '../hooks/useLeaveData'
import {
  LEAVE_ACCRUAL_METHOD_LABELS,
  formatDate,
  formatDays,
  type PositionLeavePolicy,
  type PositionLeavePolicyPayload,
} from '../types/leaveTypes'

const ALLOCATION_STATUS_TONE = {
  active: 'success',
  inactive: 'neutral',
} as const

const PositionLeaveAllocationTab = () => {
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const { positions, loading: positionsLoading } = usePositions()
  const { leavePolicies } = useLeavePolicies()

  const [selectedPositionId, setSelectedPositionId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')

  const activePositionId = selectedPositionId || positions[0]?.id || ''

  const { positionLeavePolicies, loading, error, reload } = usePositionLeavePolicies(
    activePositionId || undefined,
    {
      status: statusFilter || undefined,
      effective_date: effectiveDate || undefined,
    },
  )

  const selectedPosition = useMemo(
    () => positions.find((position) => position.id === activePositionId) ?? null,
    [positions, activePositionId],
  )

  const openForm = (existing?: PositionLeavePolicy) => {
    const payload: PositionLeavePolicyPayload = {
      leave_policy_id: existing?.leave_policy_id ?? leavePolicies[0]?.id ?? '',
      entitlement_days:
        existing?.entitlement_days != null ? Number(existing.entitlement_days) : null,
      is_mandatory: existing?.is_mandatory ?? true,
      effective_from:
        existing?.effective_from?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      effective_to: existing?.effective_to?.slice(0, 10) ?? null,
      status: existing?.status ?? 'active',
    }

    showForm({
      title: existing ? 'Edit leave allocation' : 'Add leave allocation',
      content: (
        <div className="grid gap-3">
          <p className="text-xs text-slate-500">
            {selectedPosition
              ? `Position: ${selectedPosition.title} (${selectedPosition.code})`
              : 'No position selected'}
          </p>
          <FormField label="Leave policy" required>
            <select
              defaultValue={payload.leave_policy_id}
              onChange={(event) => {
                payload.leave_policy_id = event.target.value
              }}
              className={textInputClass}
            >
              <option value="">Select a leave policy</option>
              {leavePolicies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.leave_type?.name ?? policy.name} — {policy.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Entitlement override (days)" hint="Leave empty to use the policy default">
              <input
                type="number"
                min={0}
                max={365}
                step="0.5"
                defaultValue={payload.entitlement_days ?? ''}
                onChange={(event) => {
                  payload.entitlement_days =
                    event.target.value === '' ? null : Number(event.target.value)
                }}
                className={textInputClass}
              />
            </FormField>
            <FormField label="Status">
              <select
                defaultValue={payload.status}
                onChange={(event) => {
                  payload.status = event.target.value as PositionLeavePolicyPayload['status']
                }}
                className={textInputClass}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              defaultChecked={payload.is_mandatory}
              onChange={(event) => {
                payload.is_mandatory = event.target.checked
              }}
              className="h-4 w-4 rounded border-slate-300"
            />
            Mandatory for this position
          </label>
        </div>
      ),
      primaryLabel: existing ? 'Save changes' : 'Add allocation',
      onPrimary: async () => {
        try {
          if (existing) {
            await leaveApi.updatePositionLeavePolicy(existing.id, payload)
          } else {
            await leaveApi.assignPositionLeavePolicy(activePositionId, payload)
          }
        } catch (err) {
          throw new Error(leaveErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const confirmDelete = (allocation: PositionLeavePolicy) => {
    openModal({
      title: 'Remove leave allocation',
      content: (
        <p className="text-sm text-slate-600">
          Remove <span className="font-medium">{allocation.leave_policy?.name ?? 'this policy'}</span>{' '}
          from this position? Existing employee balances are not affected.
        </p>
      ),
      primaryLabel: 'Remove',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await leaveApi.deletePositionLeavePolicy(allocation.id)
        } catch (err) {
          throw new Error(leaveErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<PositionLeavePolicy>> = [
    {
      key: 'leave_type',
      header: 'Leave type',
      sortValue: (row) => row.leave_policy?.leave_type?.name ?? '',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">
            {row.leave_policy?.leave_type?.name ?? '—'}
          </p>
          <p className="text-xs text-slate-400">
            {row.leave_policy?.leave_type?.is_paid ? 'Paid' : 'Unpaid'}
          </p>
        </div>
      ),
    },
    {
      key: 'policy',
      header: 'Policy',
      sortValue: (row) => row.leave_policy?.name ?? '',
      render: (row) => row.leave_policy?.name ?? '—',
    },
    {
      key: 'entitlement',
      header: 'Entitlement',
      width: '130px',
      sortValue: (row) => Number(row.entitlement_days ?? row.leave_policy?.entitlement_days ?? 0),
      render: (row) =>
        row.entitlement_days != null
          ? formatDays(row.entitlement_days)
          : `${formatDays(row.leave_policy?.entitlement_days)} (default)`,
    },
    {
      key: 'accrual',
      header: 'Accrual method',
      width: '150px',
      hideBelow: 'md',
      render: (row) =>
        row.leave_policy
          ? LEAVE_ACCRUAL_METHOD_LABELS[row.leave_policy.accrual_method] ??
            row.leave_policy.accrual_method
          : '—',
    },
    {
      key: 'carry',
      header: 'Carry forward',
      width: '130px',
      hideBelow: 'lg',
      render: (row) => formatDays(row.leave_policy?.carry_forward_limit),
    },
    {
      key: 'eligibility',
      header: 'Eligibility / Rules',
      hideBelow: 'lg',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.is_mandatory ? 'Mandatory' : 'Optional'} ·{' '}
          {formatDate(row.effective_from)} →{' '}
          {row.effective_to ? formatDate(row.effective_to) : 'Open'}
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
          tone={ALLOCATION_STATUS_TONE[row.status]}
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
          ariaLabel="Leave allocation actions"
          items={[
            {
              key: 'edit',
              label: 'Edit',
              icon: <Pencil size={16} className="shrink-0 text-slate-500" />,
              onClick: () => openForm(row),
            },
            {
              key: 'delete',
              label: 'Remove',
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
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Positions panel */}
      <aside className="rounded-xl border border-[var(--dni-border)] bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
          <Users size={16} className="text-slate-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Positions
          </h3>
        </div>
        <div className="max-h-[560px] overflow-y-auto p-2">
          {positionsLoading && positions.length === 0 && (
            <p className="px-2 py-3 text-xs text-slate-400">Loading positions…</p>
          )}
          {!positionsLoading && positions.length === 0 && (
            <p className="px-2 py-3 text-xs text-slate-400">No positions found.</p>
          )}
          <ul className="space-y-1">
            {positions.map((position) => {
              const isActive = position.id === activePositionId
              return (
                <li key={position.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedPositionId(position.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? 'bg-[var(--dni-primary-soft)] text-[var(--dni-primary-700)]'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{position.title}</span>
                      <span className="block truncate text-xs text-slate-400">
                        {position.department?.name ?? position.code}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {position.employees_count ?? 0}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </aside>

      {/* Allocation table */}
      <section className="min-w-0 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {selectedPosition ? selectedPosition.title : 'Select a position'}
          </h2>
          <p className="text-xs text-slate-500">
            Assigned leave types and policies for the selected position.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-[var(--dni-border)] bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[160px] flex-1">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Position
            </span>
            <select
              value={activePositionId}
              onChange={(event) => setSelectedPositionId(event.target.value)}
              className={textInputClass}
            >
              {positions.length === 0 && <option value="">No positions</option>}
              {positions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.title}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px] flex-1">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Employment type
            </span>
            <select disabled className={textInputClass} defaultValue="full_time">
              <option value="full_time">All employment types</option>
            </select>
          </div>
          <div className="min-w-[140px] flex-1">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={textInputClass}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="min-w-[140px] flex-1">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Effective date
            </span>
            <input
              type="date"
              value={effectiveDate}
              onChange={(event) => setEffectiveDate(event.target.value)}
              className={textInputClass}
            />
          </div>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => openForm()}
            disabled={!activePositionId}
          >
            <Plus size={16} />
            Add / Edit Allocation
          </button>
        </div>

        <DataTable<PositionLeavePolicy>
          columns={columns}
          rows={positionLeavePolicies}
          rowKey={(row) => row.id}
          loading={loading}
          error={error}
          emptyMessage="No leave policies allocated to this position yet."
          itemLabel="leave allocations"
          minWidth="960px"
          fixedLayout
        />
      </section>
    </div>
  )
}

export default PositionLeaveAllocationTab
