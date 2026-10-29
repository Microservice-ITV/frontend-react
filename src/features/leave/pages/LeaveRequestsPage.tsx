import { useState } from 'react'
import { Plus } from 'lucide-react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import { useGlobalModal } from '@/components/ui/GlobalModalProvider'
import {
  FormField,
  primaryButtonClass,
  textInputClass,
} from '@/features/employees/components/forms/FormField'
import { useEmployeeStyleForm } from '@/features/employees/components/forms/useEmployeeStyleForm'
import { useEmployees } from '@/features/employees/hooks/useEmployeeData'
import { leaveApi, leaveErrorMessage } from '../api/leaveApi'
import { LeaveRequestStatusBadge } from '../components/LeaveBadges'
import { useLeavePolicies, useLeaveRequests } from '../hooks/useLeaveData'
import {
  LEAVE_REQUEST_STATUSES,
  LEAVE_REQUEST_STATUS_LABELS,
  formatDate,
  formatDays,
  type LeaveRequest,
  type LeaveRequestPayload,
  type LeaveRequestStatus,
} from '../types/leaveTypes'

interface LeaveRequestsPageProps {
  /** Hide the "New request" action (warehouse managers review staff requests read-only). */
  hideCreate?: boolean
}

const LeaveRequestsPage = ({ hideCreate = false }: LeaveRequestsPageProps) => {
  const { openModal } = useGlobalModal()
  const { showForm, formPage } = useEmployeeStyleForm()
  const [status, setStatus] = useState<LeaveRequestStatus | ''>('')
  const { employees } = useEmployees()
  const { leavePolicies } = useLeavePolicies()
  const { leaveRequests, loading, error, reload } = useLeaveRequests({
    status: status || undefined,
  })

  const openCreate = () => {
    const payload: LeaveRequestPayload = {
      employee_id: '',
      leave_policy_id: leavePolicies[0]?.id ?? '',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
      reason: '',
    }

    showForm({
      title: 'New leave request',
      content: (
        <div className="grid gap-3">
          <FormField label="Employee" required>
            <select
              defaultValue={payload.employee_id}
              onChange={(event) => {
                payload.employee_id = event.target.value
              }}
              className={textInputClass}
            >
              <option value="">Select an employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} ({employee.employee_code})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Leave policy" required>
            <select
              defaultValue={payload.leave_policy_id}
              onChange={(event) => {
                payload.leave_policy_id = event.target.value
              }}
              className={textInputClass}
            >
              <option value="">Select a policy</option>
              {leavePolicies.map((policy) => (
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
          await leaveApi.createLeaveRequest({
            ...payload,
            reason: payload.reason || null,
          })
        } catch (err) {
          throw new Error(leaveErrorMessage(err))
        }
        await reload()
      },
    })
  }

  const columns: Array<DataTableColumn<LeaveRequest>> = [
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
      key: 'leave',
      header: 'Leave type',
      width: '160px',
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
  ]

  if (formPage) return formPage

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leave Requests</h1>
          <p className="text-sm text-slate-500">
            {hideCreate
              ? 'Leave requests from your staff and their approval status.'
              : 'All leave requests across the organisation and their approval status.'}
          </p>
        </div>
        {!hideCreate && (
          <button type="button" className={primaryButtonClass} onClick={openCreate}>
            <Plus size={16} />
            New request
          </button>
        )}
      </div>

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
        columns={columns}
        rows={leaveRequests}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No leave requests found."
        itemLabel="requests"
        minWidth="900px"
        fixedLayout
      />
    </div>
  )
}

export default LeaveRequestsPage
