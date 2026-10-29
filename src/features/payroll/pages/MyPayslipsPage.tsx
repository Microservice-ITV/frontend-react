import { Eye } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import { useMyPayslips } from '../hooks/usePayrollData'
import type { PayrollAreaRoot } from '../config/payrollPaths'
import { PayslipStatusBadge } from '../components/PayrollBadges'
import { formatDate, formatMoney, type Payslip } from '../types/payrollTypes'

const MyPayslipsPage = ({ root }: { root: PayrollAreaRoot }) => {
  void root
  const { openModal } = useGlobalModal()
  const { payslips, loading, error } = useMyPayslips()

  const openView = (payslip: Payslip) => {
    const snapshot = payslip.snapshot
    openModal({
      title: `Payslip ${payslip.payslip_number}`,
      content: (
        <div className="grid gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
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
                  <span
                    className={line.line_type === 'EARNING' ? 'text-emerald-600' : 'text-rose-600'}
                  >
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

  const columns: Array<DataTableColumn<Payslip>> = [
    {
      key: 'number',
      header: 'Payslip',
      width: '170px',
      sortValue: (row) => row.payslip_number,
      render: (row) => <span className="font-medium text-slate-900">{row.payslip_number}</span>,
    },
    {
      key: 'period',
      header: 'Period',
      sortValue: (row) => row.snapshot?.period?.start ?? '',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.snapshot?.period?.start)} → {formatDate(row.snapshot?.period?.end)}
        </span>
      ),
    },
    {
      key: 'gross',
      header: 'Gross',
      width: '130px',
      hideBelow: 'md',
      align: 'right',
      render: (row) => (
        <span className="text-xs text-slate-700">
          {formatMoney(row.snapshot?.gross_pay, row.snapshot?.currency)}
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
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Payslips</h1>
        <p className="text-sm text-slate-500">Payslips issued to you.</p>
      </div>

      <DataTable<Payslip>
        columns={columns}
        rows={payslips}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No payslips available yet."
        itemLabel="payslips"
        minWidth="780px"
        fixedLayout
      />
    </div>
  )
}

export default MyPayslipsPage
