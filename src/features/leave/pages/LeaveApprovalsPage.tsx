import { CheckCircle2, XCircle } from 'lucide-react'
import { useAppSelector } from '@/app/hooks'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import { FormField, textInputClass } from '@/features/employees/components/forms/FormField'
import { leaveApi, leaveErrorMessage } from '../api/leaveApi'
import { useLeaveApprovals } from '../hooks/useLeaveData'
import { formatDate, formatDays, type LeaveApproval } from '../types/leaveTypes'

interface LeaveApprovalsPageProps {
  /** Limit the queue to approval steps assigned to the signed-in user (warehouse manager scope). */
  scopeToCurrentUser?: boolean
}

const LeaveApprovalsPage = ({ scopeToCurrentUser = false }: LeaveApprovalsPageProps) => {
  const { openModal } = useGlobalModal()
  const { user } = useAppSelector((s) => s.auth)
  const { leaveApprovals, loading, error, reload } = useLeaveApprovals(
    scopeToCurrentUser && user?.id ? { manager_user_id: user.id } : undefined,
  )

  const openReview = (approval: LeaveApproval, decision: 'APPROVED' | 'REJECTED') => {
    const request = approval.leave_request
    const payload = { comment: '' }

    openModal({
      title: decision === 'APPROVED' ? 'Approve leave request' : 'Reject leave request',
      content: (
        <div className="grid gap-3">
          <p className="text-sm text-slate-500">
            {request?.employee?.full_name ?? '—'} requested{' '}
            {formatDays(request?.requested_days)} ({formatDate(request?.start_date)} →{' '}
            {formatDate(request?.end_date)}) — step {approval.step_order}.
          </p>
          <FormField label="Comment">
            <textarea
              rows={3}
              onChange={(event) => {
                payload.comment = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
        </div>
      ),
      primaryLabel: decision === 'APPROVED' ? 'Approve' : 'Reject',
      primaryVariant: decision === 'APPROVED' ? 'success' : 'danger',
      onPrimary: async () => {
        if (!request) return
        try {
          if (decision === 'APPROVED') {
            await leaveApi.approveLeaveRequest(request.id, payload.comment || null)
          } else {
            await leaveApi.rejectLeaveRequest(request.id, payload.comment || null)
          }
        } catch (err) {
          throw new Error(leaveErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<LeaveApproval>> = [
    {
      key: 'employee',
      header: 'Employee',
      sortValue: (row) => row.leave_request?.employee?.full_name ?? '',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900">
            {row.leave_request?.employee?.full_name ?? '—'}
          </p>
          <p className="text-xs text-slate-400">
            {row.leave_request?.employee?.employee_code ?? ''}
          </p>
        </div>
      ),
    },
    {
      key: 'leave',
      header: 'Leave type',
      width: '160px',
      render: (row) =>
        row.leave_request?.leave_policy?.leave_type?.name ??
        row.leave_request?.leave_policy?.name ??
        '—',
    },
    {
      key: 'dates',
      header: 'Dates',
      width: '220px',
      hideBelow: 'md',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.leave_request?.start_date)} → {formatDate(row.leave_request?.end_date)}
        </span>
      ),
    },
    {
      key: 'days',
      header: 'Days',
      width: '100px',
      hideBelow: 'lg',
      render: (row) => formatDays(row.leave_request?.requested_days),
    },
    {
      key: 'step',
      header: 'Step',
      width: '90px',
      sortValue: (row) => row.step_order,
      render: (row) => (
        <span className="text-xs text-slate-600">
          Step {row.step_order}
          {row.approver_user_id ? '' : ' · HR pool'}
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
          ariaLabel="Leave approval actions"
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
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Leave Approvals</h1>
        <p className="text-sm text-slate-500">
          {scopeToCurrentUser
            ? 'Pending approval steps assigned to you. Approve or reject each request from your staff.'
            : 'Pending approval steps awaiting your review. HR-pool steps can be actioned by any approver.'}
        </p>
      </div>

      <DataTable<LeaveApproval>
        columns={columns}
        rows={leaveApprovals}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No leave approvals pending."
        itemLabel="approvals"
        minWidth="900px"
        fixedLayout
      />
    </div>
  )
}

export default LeaveApprovalsPage
