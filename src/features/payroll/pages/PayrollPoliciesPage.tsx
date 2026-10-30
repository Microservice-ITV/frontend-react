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
import { payrollApi, payrollErrorMessage } from '../api/payrollApi'
import { usePayrollPolicies } from '../hooks/usePayrollData'
import type { PayrollAreaRoot } from '../config/payrollPaths'
import type { PayrollPolicy, PayrollPolicyPayload } from '../types/payrollTypes'

const numberValue = (value: string): number => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

const PayrollPoliciesPage = ({ root }: { root: PayrollAreaRoot }) => {
  void root
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('')
  const { payrollPolicies, loading, error, reload } = usePayrollPolicies({
    is_active: activeFilter === '' ? undefined : activeFilter === 'true',
  })

  const openForm = (existing?: PayrollPolicy) => {
    const payload: PayrollPolicyPayload = {
      name: existing?.name ?? '',
      currency: existing?.currency ?? 'USD',
      standard_working_days: existing?.standard_working_days ?? 6,
      standard_daily_hours: numberValue(existing?.standard_daily_hours ?? '8'),
      overtime_rate_multiplier: numberValue(existing?.overtime_rate_multiplier ?? '1.5'),
      tax_rate: numberValue(existing?.tax_rate ?? '0'),
      lateness_deduction_per_minute: numberValue(
        existing?.lateness_deduction_per_minute ?? '0',
      ),
      absence_deduction_per_day: numberValue(existing?.absence_deduction_per_day ?? '0'),
      unpaid_leave_deduction_per_day: numberValue(
        existing?.unpaid_leave_deduction_per_day ?? '0',
      ),
      is_active: existing?.is_active ?? true,
      effective_from: existing?.effective_from ?? null,
      effective_to: existing?.effective_to ?? null,
    }

    const field = (key: keyof PayrollPolicyPayload, transform?: (value: string) => unknown) => (
      <input
        type={typeof payload[key] === 'number' ? 'number' : 'text'}
        step="any"
        defaultValue={payload[key] === null || payload[key] === undefined ? '' : String(payload[key])}
        onChange={(event) => {
          const next = transform
            ? transform(event.target.value)
            : event.target.value
          ;(payload as unknown as Record<string, unknown>)[key as string] = next
        }}
        className={textInputClass}
      />
    )

    showForm({
      title: existing ? 'Edit payroll policy' : 'New payroll policy',
      content: (
        <div className="grid gap-3">
          <FormField label="Name" required>
            <input
              type="text"
              defaultValue={payload.name}
              placeholder="e.g. Standard retail policy"
              onChange={(event) => {
                payload.name = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Currency">
              <input
                type="text"
                defaultValue={payload.currency}
                onChange={(event) => {
                  payload.currency = event.target.value.toUpperCase()
                }}
                className={textInputClass}
              />
            </FormField>
            <FormField label="Working days / month">
              {field('standard_working_days', (value) => numberValue(value))}
            </FormField>
            <FormField label="Hours / day">
              {field('standard_daily_hours', (value) => numberValue(value))}
            </FormField>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Overtime multiplier">
              {field('overtime_rate_multiplier', (value) => numberValue(value))}
            </FormField>
            <FormField label="Tax rate">
              {field('tax_rate', (value) => numberValue(value))}
            </FormField>
            <FormField label="Lateness / minute">
              {field('lateness_deduction_per_minute', (value) => numberValue(value))}
            </FormField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Absence / day">
              {field('absence_deduction_per_day', (value) => numberValue(value))}
            </FormField>
            <FormField label="Unpaid leave / day">
              {field('unpaid_leave_deduction_per_day', (value) => numberValue(value))}
            </FormField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Effective from">
              <input
                type="date"
                defaultValue={payload.effective_from ?? ''}
                onChange={(event) => {
                  payload.effective_from = event.target.value || null
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
      ),
      primaryLabel: existing ? 'Save changes' : 'Create',
      onPrimary: async () => {
        try {
          if (existing) {
            await payrollApi.updatePolicy(existing.id, payload)
          } else {
            await payrollApi.createPolicy(payload)
          }
        } catch (err) {
          throw new Error(payrollErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const confirmDelete = (policy: PayrollPolicy) => {
    openModal({
      title: 'Delete payroll policy',
      content: (
        <p className="text-sm text-slate-600">
          Delete <span className="font-medium">{policy.name}</span>? Existing payroll runs keep
          their own policy snapshot.
        </p>
      ),
      primaryLabel: 'Delete',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await payrollApi.deletePolicy(policy.id)
        } catch (err) {
          throw new Error(payrollErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<PayrollPolicy>> = [
    {
      key: 'name',
      header: 'Policy',
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.currency}</p>
        </div>
      ),
    },
    {
      key: 'time',
      header: 'Days / hours',
      width: '140px',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.standard_working_days}d · {row.standard_daily_hours}h
        </span>
      ),
    },
    {
      key: 'overtime',
      header: 'Overtime',
      width: '110px',
      hideBelow: 'md',
      render: (row) => <span className="text-xs text-slate-600">×{row.overtime_rate_multiplier}</span>,
    },
    {
      key: 'tax',
      header: 'Tax rate',
      width: '100px',
      hideBelow: 'md',
      render: (row) => <span className="text-xs text-slate-600">{row.tax_rate}</span>,
    },
    {
      key: 'window',
      header: 'Effective',
      width: '190px',
      hideBelow: 'lg',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.effective_from ?? '—'} → {row.effective_to ?? '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
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
          ariaLabel="Payroll policy actions"
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
          <h1 className="text-xl font-bold text-slate-900">Payroll Policies</h1>
          <p className="text-sm text-slate-500">
            Calculation rules for base pay, overtime, deductions and tax.
          </p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={() => openForm()}>
          <Plus size={16} />
          New payroll policy
        </button>
      </div>

      <FilterBar
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

      <DataTable<PayrollPolicy>
        columns={columns}
        rows={payrollPolicies}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No payroll policies found."
        itemLabel="policies"
        minWidth="860px"
        fixedLayout
      />
    </div>
  )
}

export default PayrollPoliciesPage
