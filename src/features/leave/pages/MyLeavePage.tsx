import { useMemo, useState } from 'react'
import { CalendarPlus, XCircle } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import RowActionMenu from '@/components/ui/RowActionMenu'
import {
  FormField,
  primaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { leaveApi, leaveErrorMessage } from '../api/leaveApi'
import { LeaveRequestStatusBadge } from '../components/LeaveBadges'
import {
  useLeavePolicies,
  useMyLeaveBalances,
  useMyLeaveRequests,
} from '../hooks/useLeaveData'
import {
  LEAVE_REQUEST_STATUSES,
  LEAVE_REQUEST_STATUS_LABELS,
  formatDate,
  formatDays,
  type LeaveBalance,
  type LeaveRequest,
  type LeaveRequestPayload,
  type LeaveRequestStatus,
} from '../types/leaveTypes'

const currentYear = new Date().getFullYear()

const MyLeavePage = () => {
  const { openModal } = useGlobalModal()
  const [status, setStatus] = useState<LeaveRequestStatus | ''>('')
  const { leavePolicies } = useLeavePolicies({ search: undefined })
  const {
    leaveBalances,
    loading: balancesLoading,
    error: balancesError,
  } = useMyLeaveBalances({ leave_year: currentYear })
  const {
    leaveRequests,
    loading: requestsLoading,
    error: requestsError,
    reload: reloadRequests,
  } = useMyLeaveRequests({ status: status || undefined })

  const activePolicies = useMemo(
    () => leavePolicies.filter((policy) => policy.leave_type?.is_active !== false),
    [leavePolicies],
  )

  const openCreate = () => {
    const today = new Date().toISOString().slice(0, 10)
    const payload: LeaveRequestPayload = {
      leave_policy_id: activePolicies[0]?.id ?? '',
      start_date: today,
      end_date: today,
      reason: '',
    }

    openModal({
      title: 'Request leave',
      content: (
        <div className="grid gap-3">
          <FormField label="Leave type" required>
            <select
              defaultValue={payload.leave_policy_id}
              onChange={(event) => {
                payload.leave_policy_id = event.target.value
              }}
              className={textInputClass}
            >
              <option value="">Select a leave type</option>
              {activePolicies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.leave_type?.name ?? policy.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Start date" required>
              <input
                type="date"
                defaultValue={payload.start_date}
                onChange={(event) => {
                  payload.start_date = event.target.value
                }}
                className={textInputClass}
              />
            </FormField>
            <FormField label="End date" required>
              <input
                type="date"
                defaultValue={payload.end_date}
                onChange={(event) => {
                  payload.end_date = event.target.value
                }}
                className={textInputClass}
              />
            </FormField>
          </div>
          <FormField label="Reason">
            <textarea
              rows={3}
              onChange={(event) => {
                payload.reason = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
        </div>
      ),
      primaryLabel: 'Submit request',
      onPrimary: async () => {
        try {
          await leaveApi.createMyLeaveRequest({
            ...payload,
            reason: payload.reason || null,
          })
        } catch (err) {
          throw new Error(leaveErrorMessage(err))
        }
        await reloadRequests()
      },
    })
  }

  const confirmCancel = (request: LeaveRequest) => {
    const payload = { reason: '' }

    openModal({
      title: 'Cancel leave request',
      content: (
        <div className="grid gap-3">
          <p className="text-sm text-slate-500">
            Cancel your {formatDays(request.requested_days)} request (
            {formatDate(request.start_date)} → {formatDate(request.end_date)})?
          </p>
          <FormField label="Reason">
            <textarea
              rows={3}
              onChange={(event) => {
                payload.reason = event.target.value
              }}
              className={textInputClass}
            />
          </FormField>
        </div>
      ),
      primaryLabel: 'Cancel request',
      primaryVariant: 'danger',
      onPrimary: async () => {
        try {
          await leaveApi.cancelLeaveRequest(request.id, payload.reason || null)
        } catch (err) {
          throw new Error(leaveErrorMessage(err))
        }
        await reloadRequests()
      },
    })
  }

  const balanceColumns: Array<DataTableColumn<LeaveBalance>> = [
    {
      key: 'leave',
      header: 'Leave type',
      render: (row) => (
        <span className="font-medium text-slate-900">
          {row.leave_policy?.leave_type?.name ?? row.leave_policy?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'entitled',
      header: 'Entitled',
      width: '110px',
      render: (row) => formatDays(row.entitled_days),
    },
    {
      key: 'used',
      header: 'Used',
      width: '110px',
      hideBelow: 'md',
      render: (row) => formatDays(row.used_days),
    },
    {
      key: 'pending',
      header: 'Pending',
      width: '110px',
      hideBelow: 'md',
      render: (row) => formatDays(row.pending_days),
    },
    {
      key: 'available',
      header: 'Available',
      width: '120px',
      sortValue: (row) => Number(row.available_days ?? 0),
      render: (row) => (
        <span className="font-medium text-slate-900">{formatDays(row.available_days ?? 0)}</span>
      ),
    },
  ]

  const requestColumns: Array<DataTableColumn<LeaveRequest>> = [
    {
      key: 'leave',
      header: 'Leave type',
      render: (row) => row.leave_policy?.leave_type?.name ?? row.leave_policy?.name ?? '—',
    },
    {
      key: 'dates',
      header: 'Dates',
      width: '220px',
      hideBelow: 'md',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDate(row.start_date)} → {formatDate(row.end_date)}
        </span>
      ),
    },
    {
      key: 'days',
      header: 'Days',
      width: '100px',
      sortValue: (row) => Number(row.requested_days),
      render: (row) => formatDays(row.requested_days),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      sortValue: (row) => row.status,
      render: (row) => <LeaveRequestStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '60px',
      render: (row) =>
        row.status === 'PENDING' ? (
          <RowActionMenu
            ariaLabel="Leave request actions"
            items={[
              {
                key: 'cancel',
                label: 'Cancel request',
                icon: <XCircle size={16} className="shrink-0 text-rose-600" />,
                className:
                  'flex w-full items-center gap-3 px-4 py-2 text-left text-xs text-red-600 hover:bg-slate-50 cursor-pointer',
                onClick: () => confirmCancel(row),
              },
            ]}
          />
        ) : null,
    },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Leave</h1>
          <p className="text-sm text-slate-500">
            Your leave balances and requests for {currentYear}.
          </p>
        </div>
        <button type="button" className={primaryButtonClass} onClick={openCreate}>
          <CalendarPlus size={16} />
          Request leave
        </button>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          My balances
        </h2>
        <DataTable<LeaveBalance>
          columns={balanceColumns}
          rows={leaveBalances}
          rowKey={(row) => row.id}
          loading={balancesLoading}
          error={balancesError}
          emptyMessage="No leave balances yet."
          itemLabel="balances"
          minWidth="620px"
          fixedLayout
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          My requests
        </h2>
        <FilterBar
          selects={[
            {
              key: 'status',
              label: 'Status',
              value: status,
              allLabel: 'All statuses',
              onChange: (value) => setStatus(value as LeaveRequestStatus | ''),
              options: LEAVE_REQUEST_STATUSES.map((option) => ({
                value: option,
                label: LEAVE_REQUEST_STATUS_LABELS[option],
              })),
            },
          ]}
        />
        <DataTable<LeaveRequest>
          columns={requestColumns}
          rows={leaveRequests}
          rowKey={(row) => row.id}
          loading={requestsLoading}
          error={requestsError}
          emptyMessage="No leave requests yet."
          itemLabel="requests"
          minWidth="720px"
          fixedLayout
        />
      </section>
    </div>
  )
}

export default MyLeavePage
