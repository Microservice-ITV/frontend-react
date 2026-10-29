import type { AxiosError } from 'axios'
import { employeeClient } from '@/lib/api/employeeClient'
import type {
  CompanyPolicy,
  CompanyPolicyPayload,
  LeaveApproval,
  LeaveBalance,
  LeaveBalanceAdjustPayload,
  LeaveListParams,
  LeavePolicy,
  LeavePolicyPayload,
  LeaveRequest,
  LeaveRequestPayload,
  LeaveType,
  LeaveTypePayload,
  Paginated,
  PositionLeavePolicy,
  PositionLeavePolicyPayload,
} from '../types/leaveTypes'

type Envelope<T> = { success: boolean; data: T }

export const leaveErrorMessage = (error: unknown): string => {
  const axiosError = error as AxiosError<{
    error?: { code?: string; message?: string }
    message?: string
    errors?: Record<string, string[]>
  }>
  const validation = axiosError.response?.data?.errors
  if (validation) {
    const first = Object.values(validation)[0]
    if (Array.isArray(first) && first.length > 0) return first[0]
  }
  return (
    axiosError.response?.data?.error?.message ??
    axiosError.response?.data?.message ??
    axiosError.message ??
    'Something went wrong'
  )
}

const cleanParams = (params?: Record<string, unknown>) => {
  if (!params) return undefined
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  )
  return Object.fromEntries(entries)
}

export const leaveApi = {
  // --- Leave types ---
  listLeaveTypes(params?: { search?: string; is_active?: boolean; per_page?: number }) {
    return employeeClient.get<Envelope<{ leave_types: Paginated<LeaveType> }>>('/leave-types', {
      params: cleanParams(params as Record<string, unknown>),
    })
  },
  createLeaveType(payload: LeaveTypePayload) {
    return employeeClient.post<Envelope<{ leave_type: LeaveType }>>('/leave-types', payload)
  },
  updateLeaveType(id: string, payload: Partial<LeaveTypePayload>) {
    return employeeClient.put<Envelope<{ leave_type: LeaveType }>>(`/leave-types/${id}`, payload)
  },
  deleteLeaveType(id: string) {
    return employeeClient.delete<Envelope<{ message: string }>>(`/leave-types/${id}`)
  },

  // --- Leave policies ---
  listLeavePolicies(params?: {
    leave_type_id?: string
    accrual_method?: string
    search?: string
    per_page?: number
  }) {
    return employeeClient.get<Envelope<{ leave_policies: Paginated<LeavePolicy> }>>(
      '/leave-policies',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  createLeavePolicy(payload: LeavePolicyPayload) {
    return employeeClient.post<Envelope<{ leave_policy: LeavePolicy }>>('/leave-policies', payload)
  },
  updateLeavePolicy(id: string, payload: Partial<LeavePolicyPayload>) {
    return employeeClient.put<Envelope<{ leave_policy: LeavePolicy }>>(
      `/leave-policies/${id}`,
      payload,
    )
  },
  deleteLeavePolicy(id: string) {
    return employeeClient.delete<Envelope<{ message: string }>>(`/leave-policies/${id}`)
  },

  // --- Position leave allocations ---
  listPositionLeavePolicies(params?: {
    position_id?: string
    leave_policy_id?: string
    leave_type_id?: string
    status?: string
    effective_date?: string
    per_page?: number
  }) {
    return employeeClient.get<Envelope<{ position_leave_policies: Paginated<PositionLeavePolicy> }>>(
      '/leave/position-policies',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  listPositionLeavePoliciesForPosition(
    positionId: string,
    params?: {
      leave_policy_id?: string
      leave_type_id?: string
      status?: string
      effective_date?: string
      per_page?: number
    },
  ) {
    return employeeClient.get<Envelope<{ position_leave_policies: Paginated<PositionLeavePolicy> }>>(
      `/leave/positions/${positionId}/policies`,
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  assignPositionLeavePolicy(positionId: string, payload: PositionLeavePolicyPayload) {
    return employeeClient.post<Envelope<{ position_leave_policy: PositionLeavePolicy }>>(
      `/leave/positions/${positionId}/policies`,
      payload,
    )
  },
  updatePositionLeavePolicy(id: string, payload: Partial<PositionLeavePolicyPayload>) {
    return employeeClient.put<Envelope<{ position_leave_policy: PositionLeavePolicy }>>(
      `/leave/position-policies/${id}`,
      payload,
    )
  },
  deletePositionLeavePolicy(id: string) {
    return employeeClient.delete<Envelope<{ message: string }>>(
      `/leave/position-policies/${id}`,
    )
  },

  // --- Company policies ---
  listCompanyPolicies(params?: {
    search?: string
    category?: string
    status?: string
    per_page?: number
  }) {
    return employeeClient.get<Envelope<{ company_policies: Paginated<CompanyPolicy> }>>(
      '/company-policies',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  createCompanyPolicy(payload: CompanyPolicyPayload) {
    return employeeClient.post<Envelope<{ company_policy: CompanyPolicy }>>(
      '/company-policies',
      payload,
    )
  },
  updateCompanyPolicy(id: string, payload: Partial<CompanyPolicyPayload>) {
    return employeeClient.put<Envelope<{ company_policy: CompanyPolicy }>>(
      `/company-policies/${id}`,
      payload,
    )
  },
  deleteCompanyPolicy(id: string) {
    return employeeClient.delete<Envelope<{ message: string }>>(`/company-policies/${id}`)
  },

  // --- Leave balances ---
  listLeaveBalances(params?: LeaveListParams) {
    return employeeClient.get<Envelope<{ leave_balances: Paginated<LeaveBalance> }>>(
      '/leave-balances',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  listMyLeaveBalances(params?: { leave_year?: number; per_page?: number }) {
    return employeeClient.get<Envelope<{ leave_balances: Paginated<LeaveBalance> }>>(
      '/leave-balances/me',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  adjustLeaveBalance(id: string, payload: LeaveBalanceAdjustPayload) {
    return employeeClient.post<Envelope<{ leave_balance: LeaveBalance }>>(
      `/leave-balances/${id}/adjust`,
      payload,
    )
  },

  // --- Leave requests ---
  listLeaveRequests(params?: LeaveListParams) {
    return employeeClient.get<Envelope<{ leave_requests: Paginated<LeaveRequest> }>>(
      '/leave-requests',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  listMyLeaveRequests(params?: { status?: string; from?: string; to?: string; per_page?: number }) {
    return employeeClient.get<Envelope<{ leave_requests: Paginated<LeaveRequest> }>>(
      '/leave-requests/me',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  createLeaveRequest(payload: LeaveRequestPayload) {
    return employeeClient.post<Envelope<{ leave_request: LeaveRequest }>>(
      '/leave-requests',
      payload,
    )
  },
  createMyLeaveRequest(payload: LeaveRequestPayload) {
    return employeeClient.post<Envelope<{ leave_request: LeaveRequest }>>(
      '/leave-requests/me',
      payload,
    )
  },
  cancelLeaveRequest(id: string, reason?: string | null) {
    return employeeClient.post<Envelope<{ leave_request: LeaveRequest }>>(
      `/leave-requests/${id}/cancel`,
      { reason: reason ?? null },
    )
  },

  // --- Leave approvals ---
  listLeaveApprovals(params?: { approver_user_id?: string; manager_user_id?: string; per_page?: number }) {
    return employeeClient.get<Envelope<{ leave_approvals: Paginated<LeaveApproval> }>>(
      '/leave-approvals',
      { params: cleanParams(params as Record<string, unknown>) },
    )
  },
  listApprovalsForRequest(requestId: string) {
    return employeeClient.get<Envelope<{ leave_approvals: LeaveApproval[] }>>(
      `/leave-requests/${requestId}/approvals`,
    )
  },
  approveLeaveRequest(id: string, comment?: string | null) {
    return employeeClient.post<Envelope<{ leave_request: LeaveRequest }>>(
      `/leave-requests/${id}/approve`,
      { decision: 'APPROVED', comment: comment ?? null },
    )
  },
  rejectLeaveRequest(id: string, comment?: string | null) {
    return employeeClient.post<Envelope<{ leave_request: LeaveRequest }>>(
      `/leave-requests/${id}/reject`,
      { decision: 'REJECTED', comment: comment ?? null },
    )
  },
}
