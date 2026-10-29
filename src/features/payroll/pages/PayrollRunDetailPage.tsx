import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Eye,
  FileText,
  Plus,
  Send,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import StatCard from '@/components/ui/StatCard'
import {
  FormField,
  primaryButtonClass,
  secondaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { useCan } from '@/app/rbac/hooks'
import { useEmployees } from '@/features/employees/hooks/useEmployeeData'
import { employeeDisplayName } from '@/features/employees/types/employeeTypes'
import { payrollApi, payrollErrorMessage } from '../api/payrollApi'
import {
  usePayrollAuditLogs,
  usePayrollRun,
  usePaymentRecords,
} from '../hooks/usePayrollData'
import { payrollPaths, type PayrollAreaRoot } from '../config/payrollPaths'
import {
  PayrollAuditActionBadge,
  PayrollLineTypeBadge,
  PayrollRunStatusBadge,
  PaymentMethodBadge,
  PaymentStatusBadge,
} from '../components/PayrollBadges'
import {
  PAYROLL_LINE_CATEGORY_LABELS,
  PAYROLL_MANUAL_CATEGORIES,
  PAYROLL_RUN_EDITABLE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  employeeLabel,
  formatDateTime,
  formatMoney,
  formatDate,
  type PayrollItem,
  type PaymentRecord,
} from '../types/payrollTypes'

type RunActionKey = 'calculate' | 'submit' | 'approve' | 'reject' | 'pay' | 'void'

const PayrollRunDetailPage = ({ root }: { root: PayrollAreaRoot }) => {
  const { id } = useParams<{ id: string }>()
  const paths = payrollPaths(root)
  const { openModal } = useGlobalModal()
  const canManage = useCan(CAPABILITIES.PAYROLL_MANAGE)
  const canApprove = useCan(CAPABILITIES.PAYROLL_APPROVE)
  const canPay = useCan(CAPABILITIES.PAYROLL_PAY)

  const { payrollRun, loading, error, reload } = usePayrollRun(id)
  const { auditLogs, reload: reloadAudit } = usePayrollAuditLogs(id)
  const {
    paymentRecords,
    loading: paymentsLoading,
    reload: reloadPayments,
  } = usePaymentRecords({ payroll_run_id: id })
  const { employees } = useEmployees()
  const [refreshing, setRefreshing] = useState(false)

  const run = payrollRun
  const items = run?.items ?? []
  const editable = run ? PAYROLL_RUN_EDITABLE_STATUSES.includes(run.status) : false

  const refresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([reload(), reloadAudit(), reloadPayments()])
    } finally {
      setRefreshing(false)
    }
  }

  const runAction = (action: RunActionKey) => {
    if (!run) return
    const labels: Record<RunActionKey, { title: string; label: string; prompt?: string }> = {
      calculate: { title: 'Calculate payroll', label: 'Calculate' },
      submit: { title: 'Submit for review', label: 'Submit' },
      approve: { title: 'Approve payroll run', label: 'Approve', prompt: 'Comment' },
      reject: { title: 'Reject payroll run', label: 'Reject', prompt: 'Reason' },
      pay: { title: 'Mark run as paid', label: 'Mark paid' },
      void: { title: 'Void payroll run', label: 'Void run', prompt: 'Reason' },
    }
    const config = labels[action]
    const prompt = { comment: '' }

    openModal({
      title: `${config.title} — ${run.reference}`,
      content: (
        <div className="grid gap-3">
          <p className="text-sm text-slate-500">
            {items.length || run.employee_count} employee · {formatMoney(run.total_net, run.currency)}{' '}
            net · {formatDate(run.period_start)} → {formatDate(run.period_end)}.
          </p>
          {config.prompt && (
            <FormField label={config.prompt}>
              <textarea
                rows={3}
                onChange={(event) => {
                  prompt.comment = event.target.value
                }}
                className={textInputClass}
              />
            </FormField>
          )}
        </div>
      ),
      primaryLabel: config.label,
      primaryVariant: action === 'reject' || action === 'void' ? 'danger' : undefined,
      onPrimary: async () => {
        try {
          if (action === 'calculate') await payrollApi.calculateRun(run.id)
          else if (action === 'submit') await payrollApi.submitRun(run.id)
          else if (action === 'approve') await payrollApi.approveRun(run.id, prompt.comment || null)
          else if (action === 'reject') await payrollApi.rejectRun(run.id, prompt.comment || null)
          else if (action === 'pay') await payrollApi.payRun(run.id)
          else await payrollApi.voidRun(run.id, prompt.comment || null)
        } catch (err) {
          throw new Error(payrollErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  const generatePayslips = () => {
    if (!run) return
    openModal({
      title: `Generate payslips — ${run.reference}`,
      content: (
        <p className="text-sm text-slate-600">
          A payslip will be generated for every employee in this run. Existing payslips are left
          untouched.
        </p>
      ),
      primaryLabel: 'Generate',
      onPrimary: async () => {
        try {
          await payrollApi.generatePayslips(run.id)
        } catch (err) {
          throw new Error(payrollErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  const openLines = (item: PayrollItem) => {
    const lines = item.lines ?? []

    openModal({
      title: `Lines — ${employeeLabel(item.employee)}`,
      content: (
        <div className="grid gap-2">
          {lines.length === 0 && (
            <p className="text-sm text-slate-500">No lines yet. Calculate the run first.</p>
          )}
          {lines.map((line) => {
            const removable =
              editable && canManage && PAYROLL_MANUAL_CATEGORIES.includes(line.category)
            return (
              <div
                key={line.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <PayrollLineTypeBadge type={line.line_type} />
                    <span className="text-xs font-medium text-slate-700">
                      {PAYROLL_LINE_CATEGORY_LABELS[line.category]}
                    </span>
                    {removable && <span className="text-[10px] text-slate-400">manual</span>}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {line.description ?? '—'}
                    {line.quantity && line.quantity !== '1'
                      ? ` · ${line.quantity} × ${line.rate}`
                      : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800">
                    {formatMoney(line.amount, item.currency)}
                  </span>
                  {removable && (
                    <button
                      type="button"
                      aria-label="Remove line"
                      className="cursor-pointer text-rose-500 hover:text-rose-700"
                      onClick={async () => {
                        try {
                          await payrollApi.removeAdjustment(run!.id, item.id, line.id)
                        } catch (err) {
                          throw new Error(payrollErrorMessage(err))
                        }
                        await refresh()
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ),
      primaryLabel: 'Close',
      onPrimary: async () => {
        await refresh()
      },
    })
  }

  const openAddAdjustment = (item: PayrollItem) => {
    const payload: {
      category: (typeof PAYROLL_MANUAL_CATEGORIES)[number]
      description: string
      quantity: number
      rate: number
      amount: number
    } = {
      category: PAYROLL_MANUAL_CATEGORIES[0],
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    }

    openModal({
      title: `Add adjustment — ${employeeLabel(item.employee)}`,
      content: (
        <div className="grid gap-3">
          <FormField label="Category" required>
            <select
              defaultValue={payload.category}
              onChange={(event) => {
                payload.category = event.target.value as typeof payload.category
              }}
              className={textInputClass}
            >
              {PAYROLL_MANUAL_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {PAYROLL_LINE_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Description" required>
            <input
              type="text"
              placeholder="e.g. Sales commission"
              onChange={(event) => {
                payload.description = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Amount" required>
              <input
                type="number"
                step="any"
                defaultValue={payload.amount}
                onChange={(event) => {
                  payload.amount = Number(event.target.value) || 0
                }}
                className={textInputClass}
              />
            </FormField>
            <FormField label="Quantity">
              <input
                type="number"
                step="any"
                defaultValue={payload.quantity}
                onChange={(event) => {
                  payload.quantity = Number(event.target.value) || 0
                }}
                className={textInputClass}
              />
            </FormField>
            <FormField label="Rate">
              <input
                type="number"
                step="any"
                defaultValue={payload.rate}
                onChange={(event) => {
                  payload.rate = Number(event.target.value) || 0
                }}
                className={textInputClass}
              />
            </FormField>
          </div>
        </div>
      ),
      primaryLabel: 'Add adjustment',
      onPrimary: async () => {
        if (!payload.description.trim()) throw new Error('Description is required')
        try {
          await payrollApi.addAdjustment(run!.id, item.id, {
            category: payload.category,
            description: payload.description,
            quantity: payload.quantity,
            rate: payload.rate,
            amount: payload.amount,
          })
        } catch (err) {
          throw new Error(payrollErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  const openRecordPayment = () => {
    if (!run) return
    const employeeOptions = employees.map((employee) => ({
      employee,
      item: items.find((entry) => entry.employee_id === employee.id) ?? null,
    }))
    const payload: {
      payroll_item_id: string | null
      employee_id: string | null
      method: (typeof PAYMENT_METHODS)[number]
      status: (typeof PAYMENT_STATUSES)[number]
      amount: number
      reference: string
      bank_name: string
      account_last4: string
      notes: string
    } = {
      payroll_item_id: null,
      employee_id: null,
      method: PAYMENT_METHODS[0],
      status: 'SUCCESS',
      amount: 0,
      reference: '',
      bank_name: '',
      account_last4: '',
      notes: '',
    }

    openModal({
      title: `Record payment — ${run.reference}`,
      content: (
        <div className="grid gap-3">
          <FormField label="Employee" required>
            <select
              onChange={(event) => {
                const option = employeeOptions.find(
                  (entry) => entry.employee.id === event.target.value,
                )
                payload.employee_id = option?.employee.id ?? null
                payload.payroll_item_id = option?.item?.id ?? null
                payload.amount = Number(option?.item?.net_pay ?? 0)
              }}
              className={textInputClass}
            >
              <option value="">
                {employeeOptions.length > 0 ? 'Select employee' : 'No employees found'}
              </option>
              {employeeOptions.map(({ employee }) => (
                <option key={employee.id} value={employee.id}>
                  {employeeDisplayName(employee)} ({employee.employee_code})
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Method">
              <select
                defaultValue={payload.method}
                onChange={(event) => {
                  payload.method = event.target.value as typeof payload.method
                }}
                className={textInputClass}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Status">
              <select
                defaultValue={payload.status}
                onChange={(event) => {
                  payload.status = event.target.value as typeof payload.status
                }}
                className={textInputClass}
              >
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PAYMENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Amount">
              <input
                type="number"
                step="any"
                defaultValue={payload.amount}
                onChange={(event) => {
                  payload.amount = Number(event.target.value) || 0
                }}
                className={textInputClass}
              />
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Reference">
              <input
                type="text"
                onChange={(event) => {
                  payload.reference = event.target.value
                }}
                className={textInputClass}
              />
            </FormField>
            <FormField label="Bank">
              <input
                type="text"
                onChange={(event) => {
                  payload.bank_name = event.target.value
                }}
                className={textInputClass}
              />
            </FormField>
            <FormField label="Account last 4">
              <input
                type="text"
                maxLength={4}
                onChange={(event) => {
                  payload.account_last4 = event.target.value
                }}
                className={textInputClass}
              />
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
      primaryLabel: 'Record payment',
      onPrimary: async () => {
        if (!payload.employee_id) throw new Error('Select an employee')
        try {
          await payrollApi.recordPayment(run.id, {
            payroll_item_id: payload.payroll_item_id,
            employee_id: payload.employee_id,
            method: payload.method,
            status: payload.status,
            amount: payload.amount,
            currency: run.currency,
            reference: payload.reference || null,
            bank_name: payload.bank_name || null,
            account_last4: payload.account_last4 || null,
            notes: payload.notes || null,
          })
        } catch (err) {
          throw new Error(payrollErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  const openPaymentStatus = (record: PaymentRecord) => {
    const payload = { status: record.status }
    openModal({
      title: `Update payment status`,
      content: (
        <div className="grid gap-3">
          <p className="text-sm text-slate-500">
            {employeeLabel(record.employee)} · {formatMoney(record.amount, record.currency)} ·{' '}
            {record.reference ?? 'no reference'}
          </p>
          <FormField label="Status">
            <select
              defaultValue={payload.status}
              onChange={(event) => {
                payload.status = event.target.value as PaymentRecord['status']
              }}
              className={textInputClass}
            >
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PAYMENT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      ),
      primaryLabel: 'Update',
      onPrimary: async () => {
        try {
          await payrollApi.updatePaymentStatus(record.id, payload.status)
        } catch (err) {
          throw new Error(payrollErrorMessage(err))
        }
        await refresh()
      },
    })
  }

  const itemColumns: Array<DataTableColumn<PayrollItem>> = [
    {
      key: 'employee',
      header: 'Employee',
      sortValue: (row) => employeeLabel(row.employee),
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{employeeLabel(row.employee)}</p>
          <p className="text-xs text-slate-400">
            {row.worked_days} worked · {row.absent_days} absent · {row.unpaid_leave_days} unpaid
          </p>
        </div>
      ),
    },
    {
      key: 'base',
      header: 'Base',
      width: '120px',
      hideBelow: 'md',
      align: 'right',
      render: (row) => <span className="text-xs text-slate-600">{formatMoney(row.base_salary, row.currency)}</span>,
    },
    {
      key: 'gross',
      header: 'Gross',
      width: '130px',
      align: 'right',
      sortValue: (row) => Number(row.gross_pay),
      render: (row) => <span className="text-xs text-slate-700">{formatMoney(row.gross_pay, row.currency)}</span>,
    },
    {
      key: 'deductions',
      header: 'Deductions',
      width: '130px',
      align: 'right',
      sortValue: (row) => Number(row.total_deductions),
      render: (row) => (
        <span className="text-xs text-rose-600">−{formatMoney(row.total_deductions, row.currency)}</span>
      ),
    },
    {
      key: 'net',
      header: 'Net pay',
      width: '140px',
      align: 'right',
      sortValue: (row) => Number(row.net_pay),
      render: (row) => (
        <span className="font-semibold text-slate-900">{formatMoney(row.net_pay, row.currency)}</span>
      ),
    },
    {
      key: 'lines',
      header: 'Lines',
      width: '90px',
      hideBelow: 'lg',
      align: 'right',
      render: (row) => <span className="text-xs text-slate-500">{row.lines?.length ?? 0}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) => (
        <RowActionMenu
          ariaLabel="Payroll item actions"
          items={[
            {
              key: 'view',
              label: 'View lines',
              icon: <Eye size={16} className="shrink-0 text-slate-500" />,
              onClick: () => openLines(row),
            },
            ...(editable && canManage
              ? [
                  {
                    key: 'adjust',
                    label: 'Add adjustment',
                    icon: <Plus size={16} className="shrink-0 text-slate-500" />,
                    onClick: () => openAddAdjustment(row),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ]

  const paymentColumns: Array<DataTableColumn<PaymentRecord>> = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => employeeLabel(row.employee),
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '130px',
      align: 'right',
      render: (row) => <span className="font-medium text-slate-900">{formatMoney(row.amount, row.currency)}</span>,
    },
    {
      key: 'method',
      header: 'Method',
      width: '130px',
      hideBelow: 'md',
      render: (row) => <PaymentMethodBadge method={row.method} />,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (row) => <PaymentStatusBadge status={row.status} />,
    },
    {
      key: 'reference',
      header: 'Reference',
      width: '150px',
      hideBelow: 'lg',
      render: (row) => <span className="text-xs text-slate-600">{row.reference ?? '—'}</span>,
    },
    {
      key: 'paidAt',
      header: 'Paid',
      width: '160px',
      hideBelow: 'lg',
      render: (row) => <span className="text-xs text-slate-600">{formatDateTime(row.paid_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) =>
        canPay ? (
          <RowActionMenu
            ariaLabel="Payment actions"
            items={[
              {
                key: 'status',
                label: 'Update status',
                onClick: () => openPaymentStatus(row),
              },
            ]}
          />
        ) : null,
    },
  ]

  if (loading && !run) {
    return <p className="text-sm text-slate-500">Loading payroll run…</p>
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Link to={paths.runs} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={14} /> Back to payroll runs
        </Link>
        <p className="text-sm text-rose-600">{error}</p>
      </div>
    )
  }

  if (!run) return null

  const actionButtons: Array<{
    key: RunActionKey | 'generate'
    label: string
    icon: typeof Calculator
    className: string
    onClick: () => void
  }> = []

  if (editable && canManage)
    actionButtons.push({
      key: 'calculate',
      label: 'Calculate',
      icon: Calculator,
      className: secondaryButtonClass,
      onClick: () => runAction('calculate'),
    })
  if ((run.status === 'DRAFT' || run.status === 'CALCULATED') && canManage)
    actionButtons.push({
      key: 'submit',
      label: 'Submit for review',
      icon: Send,
      className: secondaryButtonClass,
      onClick: () => runAction('submit'),
    })
  if (run.status === 'UNDER_REVIEW' && canApprove) {
    actionButtons.push({
      key: 'approve',
      label: 'Approve',
      icon: CheckCircle2,
      className: primaryButtonClass,
      onClick: () => runAction('approve'),
    })
    actionButtons.push({
      key: 'reject',
      label: 'Reject',
      icon: XCircle,
      className:
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50',
      onClick: () => runAction('reject'),
    })
  }
  if (run.status === 'APPROVED' && canPay)
    actionButtons.push({
      key: 'pay',
      label: 'Mark paid',
      icon: Wallet,
      className: primaryButtonClass,
      onClick: () => runAction('pay'),
    })
  if ((run.status === 'APPROVED' || run.status === 'PAID') && canManage)
    actionButtons.push({
      key: 'generate',
      label: 'Generate payslips',
      icon: FileText,
      className: secondaryButtonClass,
      onClick: generatePayslips,
    })
  if (run.status !== 'PAID' && run.status !== 'VOID' && canManage)
    actionButtons.push({
      key: 'void',
      label: 'Void',
      icon: Trash2,
      className:
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50',
      onClick: () => runAction('void'),
    })

  return (
    <div className="space-y-5">
      <div>
        <Link
          to={paths.runs}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={14} /> Back to payroll runs
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{run.reference}</h1>
              <PayrollRunStatusBadge status={run.status} size="md" />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(run.period_start)} → {formatDate(run.period_end)} · pay date{' '}
              {formatDate(run.pay_date)} · {run.payroll_policy?.name ?? 'Default policy'} ·{' '}
              {run.currency}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actionButtons.map((button) => {
              const Icon = button.icon
              return (
                <button
                  key={button.key}
                  type="button"
                  disabled={refreshing}
                  className={button.className}
                  onClick={button.onClick}
                >
                  <Icon size={16} />
                  {button.label}
                </button>
              )
            })}
          </div>
        </div>
        {run.notes && <p className="mt-2 text-sm italic text-slate-500">{run.notes}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Gross pay"
          value={formatMoney(run.total_gross, run.currency)}
          icon={TrendingUp}
          tone="brand"
        />
        <StatCard
          title="Deductions"
          value={formatMoney(run.total_deductions, run.currency)}
          icon={TrendingDown}
          tone="danger"
        />
        <StatCard
          title="Net pay"
          value={formatMoney(run.total_net, run.currency)}
          icon={Wallet}
          tone="success"
        />
        <StatCard title="Employees" value={run.employee_count} icon={Users} tone="info" />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Employees</h2>
          <span className="text-xs text-slate-400">{items.length} item{items.length === 1 ? '' : 's'}</span>
        </div>
        <DataTable<PayrollItem>
          columns={itemColumns}
          rows={items}
          rowKey={(row) => row.id}
          loading={loading}
          emptyMessage="No employees yet — calculate the run."
          itemLabel="employees"
          minWidth="960px"
          fixedLayout
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Payments</h2>
          {canPay && (
            <button type="button" className={secondaryButtonClass} onClick={openRecordPayment}>
              <Plus size={16} />
              Record payment
            </button>
          )}
        </div>
        <DataTable<PaymentRecord>
          columns={paymentColumns}
          rows={paymentRecords}
          rowKey={(row) => row.id}
          loading={paymentsLoading}
          emptyMessage="No payments recorded for this run."
          itemLabel="payments"
          minWidth="900px"
          fixedLayout
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Audit trail</h2>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-slate-500">No audit entries yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {auditLogs.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <PayrollAuditActionBadge action={entry.action} />
                    <span className="truncate text-xs text-slate-600">
                      {entry.description ?? '—'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{entry.actor_name ?? 'System'}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatDateTime(entry.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default PayrollRunDetailPage
