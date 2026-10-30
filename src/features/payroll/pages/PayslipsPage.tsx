import { useState } from 'react'
import { Eye, FileCheck2, FileX2 } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import { CAPABILITIES } from '@/app/rbac/capabilities'
import { useCan } from '@/app/rbac/hooks'
import { payrollApi, payrollErrorMessage } from '../api/payrollApi'
import { usePayslips } from '../hooks/usePayrollData'
import type { PayrollAreaRoot } from '../config/payrollPaths'
import { PayslipStatusBadge } from '../components/PayrollBadges'
import {
  PAYSLIP_STATUSES,
  PAYSLIP_STATUS_LABELS,
  employeeLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  type Payslip,
  type PayslipStatus,
} from '../types/payrollTypes'

const PayslipsPage = ({ root }: { root: PayrollAreaRoot }) => {
  void root
  const { openModal } = useGlobalModal()
  const canManage = useCan(CAPABILITIES.PAYROLL_MANAGE)
  const [statusFilter, setStatusFilter] = useState<'' | PayslipStatus>('')

  const { payslips, loading, error, reload } = usePayslips({
    status: statusFilter || undefined,
  })

  const openView = (payslip: Payslip) => {
    const snapshot = payslip.snapshot
    openModal({
      title: `Payslip ${payslip.payslip_number}`,
      content: (
        <div className="grid gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="font-medium text-slate-800">{employeeLabel(payslip.employee)}</p>
            <p className="text-xs text-slate-500">
              {payslip.payroll_run?.reference ?? '—'} ·{' '}
              {formatDate(snapshot?.period?.start)} → {formatDate(snapshot?.period?.end)}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-slate-500">Base</p>
              <p className="font-semibold text-slate-800">
                {formatMoney(snapshot?.base_salary, snapshot?.currency)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Gross</p>
              <p className="font-semibold text-slate-800">
                {formatMoney(snapshot?.gross_pay, snapshot?.currency)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Net</p>
              <p className="font-semibold text-slate-900">
                {formatMoney(snapshot?.net_pay, snapshot?.currency)}
              </p>
            </div>
          </div>
          <div className="grid gap-1">
            {(snapshot?.lines ?? []).map((line, index) => (
              <div
                key={`${line.category}-${index}`}
                className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1 text-xs last:border-0"
              >
                <span className="text-slate-600">
                  <span className={line.line_type === 'EARNING' ? 'text-emerald-600' : 'text-rose-600'}>
                    {line.line_type === 'EARNING' ? '+' : '−'}
                  </span>{' '}
                  {line.description ?? line.category}
                </span>
                <span className="font-medium text-slate-800">
                  {formatMoney(line.amount, snapshot?.currency)}
                </span>
              </div>
            ))}
            {(snapshot?.lines ?? []).length === 0 && (
              <p className="text-xs text-slate-500">No line details available.</p>
            )}
          </div>
        </div>
      ),
      primaryLabel: 'Close',
    })
  }

  const changeStatus = (payslip: Payslip, action: 'issue' | 'revoke') => {
    openModal({
      title: action === 'issue' ? 'Issue payslip' : 'Revoke payslip',
      content: (
        <p className="text-sm text-slate-600">
          {action === 'issue'
            ? `Mark ${payslip.payslip_number} as issued and available to the employee?`
            : `Revoke ${payslip.payslip_number}? The employee will no longer see it.`}
        </p>
      ),
      primaryLabel: action === 'issue' ? 'Issue' : 'Revoke',
      primaryVariant: action === 'revoke' ? 'danger' : 'success',
      onPrimary: async () => {
        try {
          if (action === 'issue') await payrollApi.issuePayslip(payslip.id)
          else await payrollApi.revokePayslip(payslip.id)
        } catch (err) {
          throw new Error(payrollErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<Payslip>> = [
    {
      key: 'number',
      header: 'Payslip',
      width: '170px',
      sortValue: (row) => row.payslip_number,
      render: (row) => <span className="font-medium text-slate-900">{row.payslip_number}</span>,
    },
    {
      key: 'employee',
      header: 'Employee',
      sortValue: (row) => employeeLabel(row.employee),
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.employee?.full_name ?? '—'}</p>
          <p className="text-xs text-slate-400">{row.employee?.employee_code ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'run',
      header: 'Run',
      width: '140px',
      hideBelow: 'md',
      render: (row) => <span className="text-xs text-slate-600">{row.payroll_run?.reference ?? '—'}</span>,
    },
    {
      key: 'period',
      header: 'Period',
      width: '200px',
      hideBelow: 'lg',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.snapshot?.period?.start)} → {formatDate(row.snapshot?.period?.end)}
        </span>
      ),
    },
    {
      key: 'net',
      header: 'Net pay',
      width: '140px',
      align: 'right',
      sortValue: (row) => Number(row.snapshot?.net_pay ?? 0),
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {formatMoney(row.snapshot?.net_pay, row.snapshot?.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (row) => <PayslipStatusBadge status={row.status} />,
    },
    {
      key: 'generated',
      header: 'Generated',
      width: '160px',
      hideBelow: 'lg',
      render: (row) => (
        <span className="text-xs text-slate-600">{formatDateTime(row.generated_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) => (
        <RowActionMenu
          ariaLabel="Payslip actions"
          items={[
            {
              key: 'view',
              label: 'View',
              icon: <Eye size={16} className="shrink-0 text-slate-500" />,
              onClick: () => openView(row),
            },
            ...(canManage && row.status === 'GENERATED'
              ? [
                  {
                    key: 'issue',
                    label: 'Issue',
                    icon: <FileCheck2 size={16} className="shrink-0 text-emerald-600" />,
                    onClick: () => changeStatus(row, 'issue'),
                  },
                ]
              : []),
            ...(canManage && row.status === 'ISSUED'
              ? [
                  {
                    key: 'revoke',
                    label: 'Revoke',
                    icon: <FileX2 size={16} className="shrink-0 text-rose-600" />,
                    className:
                      'flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer',
                    onClick: () => changeStatus(row, 'revoke'),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Payslips</h1>
        <p className="text-sm text-slate-500">
          Generated payslips across all payroll runs. Issue a payslip to release it to the employee.
        </p>
      </div>

      <FilterBar
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            allLabel: 'All statuses',
            onChange: (value) => setStatusFilter(value as '' | PayslipStatus),
            options: PAYSLIP_STATUSES.map((status) => ({
              value: status,
              label: PAYSLIP_STATUS_LABELS[status],
            })),
          },
        ]}
      />

      <DataTable<Payslip>
        columns={columns}
        rows={payslips}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No payslips found."
        itemLabel="payslips"
        minWidth="980px"
        fixedLayout
      />
    </div>
  )
}

export default PayslipsPage
