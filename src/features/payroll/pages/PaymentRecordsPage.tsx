import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import { FormField, textInputClass } from '@/features/employees/components/forms/FormField'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { useCan } from '@/app/rbac/hooks'
import { payrollApi, payrollErrorMessage } from '../api/payrollApi'
import { usePaymentRecords } from '../hooks/usePayrollData'
import type { PayrollAreaRoot } from '../config/payrollPaths'
import { PaymentMethodBadge, PaymentStatusBadge } from '../components/PayrollBadges'
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  employeeLabel,
  formatDateTime,
  formatMoney,
  type PaymentMethod,
  type PaymentRecord,
  type PaymentStatus,
} from '../types/payrollTypes'

const PaymentRecordsPage = ({ root }: { root: PayrollAreaRoot }) => {
  void root
  const { openModal } = useGlobalModal()
  const canPay = useCan(CAPABILITIES.PAYROLL_PAY)
  const [statusFilter, setStatusFilter] = useState<'' | PaymentStatus>('')
  const [methodFilter, setMethodFilter] = useState<'' | PaymentMethod>('')

  const { paymentRecords, loading, error, reload } = usePaymentRecords({
    status: statusFilter || undefined,
    method: methodFilter || undefined,
  })

  const openStatus = (record: PaymentRecord) => {
    const payload = { status: record.status }
    openModal({
      title: 'Update payment status',
      content: (
        <div className="grid gap-3">
          <p className="text-sm text-slate-500">
            {employeeLabel(record.employee)} · {formatMoney(record.amount, record.currency)} ·{' '}
            {record.payroll_run?.reference ?? '—'}
          </p>
          <FormField label="Status">
            <select
              defaultValue={payload.status}
              onChange={(event) => {
                payload.status = event.target.value as PaymentStatus
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
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<PaymentRecord>> = [
    {
      key: 'employee',
      header: 'Employee',
      sortValue: (row) => employeeLabel(row.employee),
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.employee?.full_name ?? '—'}</p>
          <p className="text-xs text-slate-400">
            {row.payroll_run?.reference ?? row.employee?.employee_code ?? ''}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      width: '140px',
      align: 'right',
      sortValue: (row) => Number(row.amount),
      render: (row) => (
        <span className="font-semibold text-slate-900">{formatMoney(row.amount, row.currency)}</span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      width: '130px',
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
      width: '160px',
      hideBelow: 'md',
      render: (row) => <span className="text-xs text-slate-600">{row.reference ?? '—'}</span>,
    },
    {
      key: 'bank',
      header: 'Account',
      width: '150px',
      hideBelow: 'lg',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.bank_name ? `${row.bank_name}${row.account_last4 ? ` ····${row.account_last4}` : ''}` : '—'}
        </span>
      ),
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
                icon: <RefreshCw size={16} className="shrink-0 text-slate-500" />,
                onClick: () => openStatus(row),
              },
            ]}
          />
        ) : null,
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Payment Records</h1>
        <p className="text-sm text-slate-500">
          Salary disbursements and their reconciliation status.
        </p>
      </div>

      <FilterBar
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            allLabel: 'All statuses',
            onChange: (value) => setStatusFilter(value as '' | PaymentStatus),
            options: PAYMENT_STATUSES.map((status) => ({
              value: status,
              label: PAYMENT_STATUS_LABELS[status],
            })),
          },
          {
            key: 'method',
            label: 'Method',
            value: methodFilter,
            allLabel: 'All methods',
            onChange: (value) => setMethodFilter(value as '' | PaymentMethod),
            options: PAYMENT_METHODS.map((method) => ({
              value: method,
              label: PAYMENT_METHOD_LABELS[method],
            })),
          },
        ]}
      />

      <DataTable<PaymentRecord>
        columns={columns}
        rows={paymentRecords}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No payment records found."
        itemLabel="payments"
        minWidth="1020px"
        fixedLayout
      />
    </div>
  )
}

export default PaymentRecordsPage
