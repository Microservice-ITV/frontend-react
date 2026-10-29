import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Plus } from 'lucide-react'
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
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { useCan } from '@/app/rbac/hooks'
import { payrollApi, payrollErrorMessage } from '../api/payrollApi'
import { usePayrollPolicies, usePayrollRuns } from '../hooks/usePayrollData'
import { payrollPaths, type PayrollAreaRoot } from '../config/payrollPaths'
import { PayrollRunStatusBadge } from '../components/PayrollBadges'
import {
  PAYROLL_RUN_EDITABLE_STATUSES,
  PAYROLL_RUN_STATUSES,
  PAYROLL_RUN_STATUS_LABELS,
  formatMoney,
  formatDate,
  type PayrollRun,
  type PayrollRunStatus,
} from '../types/payrollTypes'

type RunActionKey = 'calculate' | 'submit' | 'review' | 'pay' | 'void'

const PayrollRunsPage = ({ root }: { root: PayrollAreaRoot }) => {
  const navigate = useNavigate()
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const paths = payrollPaths(root)
  const canManage = useCan(CAPABILITIES.PAYROLL_MANAGE)
  const canApprove = useCan(CAPABILITIES.PAYROLL_APPROVE)
  const canPay = useCan(CAPABILITIES.PAYROLL_PAY)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | PayrollRunStatus>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { payrollRuns, loading, error, reload } = usePayrollRuns({
    search: search || undefined,
    status: statusFilter || undefined,
    from: from || undefined,
    to: to || undefined,
  })
  const { payrollPolicies } = usePayrollPolicies()

  const openDetail = (run: PayrollRun) => navigate(paths.runDetail(run.id))

  const availableActions = (run: PayrollRun): RunActionKey[] => {
    const editable = PAYROLL_RUN_EDITABLE_STATUSES.includes(run.status)
    const actions: RunActionKey[] = []

    if (editable && canManage) actions.push('calculate')
    if ((run.status === 'DRAFT' || run.status === 'CALCULATED') && canManage)
      actions.push('submit')
    if (run.status === 'UNDER_REVIEW' && canApprove) actions.push('review')
    if (run.status === 'APPROVED' && canPay) actions.push('pay')
    if (run.status !== 'PAID' && run.status !== 'VOID' && canManage) actions.push('void')

    return actions
  }

  const runAction = (run: PayrollRun, action: RunActionKey) => {
    const config: Record<
      RunActionKey,
      { title: string; confirmLabel: string; variant?: 'danger'; withPrompt?: boolean }
    > = {
      calculate: {
        title: 'Calculate payroll run',
        confirmLabel: 'Calculate',
      },
      submit: {
        title: 'Submit for review',
        confirmLabel: 'Submit',
      },
      review: {
        title: 'Review payroll run',
        confirmLabel: 'Approve',
        withPrompt: true,
      },
      pay: {
        title: 'Mark run as paid',
        confirmLabel: 'Mark paid',
      },
      void: {
        title: 'Void payroll run',
        confirmLabel: 'Void run',
        variant: 'danger',
        withPrompt: true,
      },
    }

    const request = config[action]
    const prompt = { comment: '', decision: action === 'review' ? 'APPROVED' : 'REJECTED' }

    showForm({
      title: `${request.title} — ${run.reference}`,
      content: (
        <div className="grid gap-3">
          <p className="text-sm text-slate-500">
            Period {formatDate(run.period_start)} → {formatDate(run.period_end)} ·{' '}
            {run.employee_count} employee{run.employee_count === 1 ? '' : 's'} ·{' '}
            {formatMoney(run.total_net, run.currency)} net.
          </p>
          {request.withPrompt && (
            <FormField label={action === 'void' ? 'Reason' : 'Comment'}>
              <textarea
                rows={3}
                placeholder={action === 'void' ? 'Why is this run being voided?' : 'Optional note'}
                onChange={(event) => {
                  prompt.comment = event.target.value
                }}
                className={textInputClass}
              />
            </FormField>
          )}
          {action === 'review' && (
            <div className="flex gap-2">
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => {
                  prompt.decision = 'APPROVED'
                }}
              >
                Approve
              </button>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                onClick={() => {
                  prompt.decision = 'REJECTED'
                }}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ),
      primaryLabel: action === 'review' ? 'Confirm' : request.confirmLabel,
      primaryVariant: request.variant,
      onPrimary: async () => {
        try {
          if (action === 'calculate') await payrollApi.calculateRun(run.id)
          else if (action === 'submit') await payrollApi.submitRun(run.id)
          else if (action === 'pay') await payrollApi.payRun(run.id)
          else if (action === 'void') await payrollApi.voidRun(run.id, prompt.comment || null)
          else if (prompt.decision === 'APPROVED')
            await payrollApi.approveRun(run.id, prompt.comment || null)
          else await payrollApi.rejectRun(run.id, prompt.comment || null)
        } catch (err) {
          throw new Error(payrollErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const openCreate = () => {
    const payload: {
      reference?: string
      period_start: string
      period_end: string
      pay_date: string | null
      currency: string
      payroll_policy_id: string | null
      notes: string
    } = {
      reference: '',
      period_start: '',
      period_end: '',
      pay_date: null,
      currency: 'USD',
      payroll_policy_id: payrollPolicies[0]?.id ?? null,
      notes: '',
    }

    showForm({
      title: 'New payroll run',
      content: (
        <div className="grid gap-3">
          <FormField label="Period start" required>
            <input
              type="date"
              onChange={(event) => {
                payload.period_start = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <FormField label="Period end" required>
            <input
              type="date"
              onChange={(event) => {
                payload.period_end = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Pay date">
              <input
                type="date"
                onChange={(event) => {
                  payload.pay_date = event.target.value || null
                }}
                className={textInputClass}
              />
            </FormField>
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
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Reference" hint="Auto-generated when blank">
              <input
                type="text"
                placeholder="e.g. PAY-2026-01"
                onChange={(event) => {
                  payload.reference = event.target.value
                }}
                className={textInputClass}
              />
            </FormField>
            <FormField label="Payroll policy">
              <select
                defaultValue={payload.payroll_policy_id ?? ''}
                onChange={(event) => {
                  payload.payroll_policy_id = event.target.value || null
                }}
                className={textInputClass}
              >
                <option value="">Default policy</option>
                {payrollPolicies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea
              rows={2}
              onChange={(event) => {
                payload.notes = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
        </div>
      ),
      primaryLabel: 'Create run',
      onPrimary: async () => {
        if (!payload.period_start || !payload.period_end) {
          throw new Error('Period start and end are required')
        }
        try {
          await payrollApi.createRun({
            ...payload,
            reference: payload.reference || undefined,
            notes: payload.notes || null,
          })
        } catch (err) {
          throw new Error(payrollErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<PayrollRun>> = [
    {
      key: 'reference',
      header: 'Run',
      width: '150px',
      sortValue: (row) => row.reference,
      render: (row) => <span className="font-medium text-slate-900">{row.reference}</span>,
    },
    {
      key: 'period',
      header: 'Period',
      width: '200px',
      sortValue: (row) => row.period_start,
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.period_start)} → {formatDate(row.period_end)}
        </span>
      ),
    },
    {
      key: 'payDate',
      header: 'Pay date',
      width: '120px',
      hideBelow: 'md',
      render: (row) => <span className="text-xs text-slate-600">{formatDate(row.pay_date)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (row) => <PayrollRunStatusBadge status={row.status} />,
    },
    {
      key: 'employees',
      header: 'Employees',
      width: '100px',
      hideBelow: 'lg',
      align: 'right',
      sortValue: (row) => row.employee_count,
      render: (row) => <span className="text-xs text-slate-600">{row.employee_count}</span>,
    },
    {
      key: 'net',
      header: 'Net total',
      width: '140px',
      align: 'right',
      sortValue: (row) => Number(row.total_net),
      render: (row) => (
        <span className="font-medium text-slate-900">
          {formatMoney(row.total_net, row.currency)}
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
          ariaLabel="Payroll run actions"
          items={[
            {
              key: 'view',
              label: 'View details',
              icon: <Eye size={16} className="shrink-0 text-slate-500" />,
              onClick: () => openDetail(row),
            },
            ...availableActions(row).map((action) => ({
              key: action,
              label:
                action === 'review'
                  ? 'Approve / reject'
                  : action === 'calculate'
                    ? 'Calculate'
                    : action === 'submit'
                      ? 'Submit for review'
                      : action === 'pay'
                        ? 'Mark paid'
                        : 'Void',
              onClick: () => runAction(row, action),
            })),
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
          <h1 className="text-xl font-bold text-slate-900">Payroll Runs</h1>
          <p className="text-sm text-slate-500">
            Create, calculate and approve periodic payroll batches.
          </p>
        </div>
        {canManage && (
          <button type="button" className={primaryButtonClass} onClick={openCreate}>
            <Plus size={16} />
            New payroll run
          </button>
        )}
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search by reference',
        }}
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            allLabel: 'All statuses',
            onChange: (value) => setStatusFilter(value as '' | PayrollRunStatus),
            options: PAYROLL_RUN_STATUSES.map((status) => ({
              value: status,
              label: PAYROLL_RUN_STATUS_LABELS[status],
            })),
          },
        ]}
        dateRange={{
          from,
          to,
          onFromChange: setFrom,
          onToChange: setTo,
        }}
      />

      <DataTable<PayrollRun>
        columns={columns}
        rows={payrollRuns}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No payroll runs found."
        itemLabel="runs"
        minWidth="940px"
        fixedLayout
        onRowClick={openDetail}
      />
    </div>
  )
}

export default PayrollRunsPage
