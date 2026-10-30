import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import { FormField, textInputClass } from '@/features/employees/components/forms/FormField'
import { attendanceApi, attendanceErrorMessage } from '../api/attendanceApi'
import { OvertimeStatusBadge } from '../components/AttendanceBadges'
import { useOvertimeRequests } from '../hooks/useAttendanceData'
import {
  OVERTIME_STATUSES,
  OVERTIME_STATUS_LABELS,
  formatMinutes,
  type OvertimeRequest,
  type OvertimeStatus,
} from '../types/attendanceTypes'

const OvertimeRequestsPage = () => {
  const { openModal } = useGlobalModal()
  const [status, setStatus] = useState<OvertimeStatus | ''>('')
  const { requests, loading, error, reload } = useOvertimeRequests({
    status: status || undefined,
  })

  const openReview = (request: OvertimeRequest, decision: 'APPROVED' | 'REJECTED') => {
    const payload = {
      status: decision,
      approved_minutes: decision === 'APPROVED' ? request.requested_minutes : 0,
    }

    openModal({
      title: decision === 'APPROVED' ? 'Approve overtime' : 'Reject overtime',
      content: (
        <div className="grid gap-3">
          <p className="text-sm text-slate-500">
            {request.employee?.full_name ?? '—'} requested{' '}
            {formatMinutes(request.requested_minutes)}.
          </p>
          {decision === 'APPROVED' && (
            <FormField label="Approved minutes" required>
              <input
                type="number"
                min={0}
                max={1440}
                defaultValue={payload.approved_minutes}
                onChange={(event) => {
                  payload.approved_minutes = Number(event.target.value)
                }}
                className={textInputClass}
              />
            </FormField>
          )}
        </div>
      ),
      primaryLabel: decision === 'APPROVED' ? 'Approve' : 'Reject',
      primaryVariant: decision === 'APPROVED' ? 'success' : 'danger',
      onPrimary: async () => {
        try {
          await attendanceApi.reviewOvertimeRequest(request.id, {
            status: decision,
            approved_minutes: decision === 'APPROVED' ? payload.approved_minutes : null,
          })
        } catch (err) {
          throw new Error(attendanceErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<OvertimeRequest>> = [
    {
      key: 'employee',
      header: 'Employee',
      sortValue: (row) => row.employee?.full_name ?? '',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{row.employee?.full_name ?? '—'}</p>
          <p className="text-xs text-slate-400">{row.employee?.employee_code ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'requested',
      header: 'Requested',
      width: '130px',
      sortValue: (row) => row.requested_minutes,
      render: (row) => formatMinutes(row.requested_minutes),
    },
    {
      key: 'approved',
      header: 'Approved',
      width: '130px',
      hideBelow: 'md',
      sortValue: (row) => row.approved_minutes ?? 0,
      render: (row) => formatMinutes(row.approved_minutes),
    },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'lg',
      render: (row) => (
        <span className="line-clamp-2 text-xs text-slate-600" title={row.reason ?? ''}>
          {row.reason ?? '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      sortValue: (row) => row.status,
      render: (row) => <OvertimeStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) =>
        row.status === 'PENDING' ? (
          <RowActionMenu
            ariaLabel="Overtime request actions"
            items={[
              {
                key: 'approve',
                label: 'Approve',
                icon: <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />,
                onClick: () => openReview(row, 'APPROVED'),
              },
              {
                key: 'reject',
                label: 'Reject',
                icon: <XCircle size={16} className="shrink-0 text-rose-600" />,
                className:
                  'flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer',
                onClick: () => openReview(row, 'REJECTED'),
              },
            ]}
          />
        ) : null,
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Overtime Requests</h1>
        <p className="text-sm text-slate-500">
          Review and approve overtime logged by employees.
        </p>
      </div>

      <FilterBar
        selects={[
          {
            key: 'status',
            label: 'Status',
            value: status,
            allLabel: 'All statuses',
            onChange: (value) => setStatus(value as OvertimeStatus | ''),
            options: OVERTIME_STATUSES.map((option) => ({
              value: option,
              label: OVERTIME_STATUS_LABELS[option],
            })),
          },
        ]}
      />

      <DataTable<OvertimeRequest>
        columns={columns}
        rows={requests}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No overtime requests found."
        itemLabel="requests"
        minWidth="900px"
        fixedLayout
      />
    </div>
  )
}

export default OvertimeRequestsPage
