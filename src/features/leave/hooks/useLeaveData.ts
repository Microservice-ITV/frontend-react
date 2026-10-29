import { useCallback, useEffect, useRef, useState } from 'react'
import { leaveApi, leaveErrorMessage } from '../api/leaveApi'
import type {
  CompanyPolicy,
  LeaveApproval,
  LeaveBalance,
  LeaveListParams,
  LeavePolicy,
  LeaveRequest,
  LeaveType,
  Paginated,
  PositionLeavePolicy,
} from '../types/leaveTypes'

const REFERENCE_PAGE_SIZE = 200

type Resource<T> = {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

const useResource = <T,>(loader: () => Promise<T>, key: string, enabled = true): Resource<T> => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await loaderRef.current())
    } catch (err) {
      setData(null)
      setError(leaveErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    void load()
  }, [load, key, enabled])

  return { data, loading, error, reload: load }
}

export const useLeaveTypes = (params?: { search?: string; is_active?: boolean }) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<LeaveType>>(
    () => leaveApi.listLeaveTypes(request).then((response) => response.data.data.leave_types),
    JSON.stringify(request),
  )
  return {
    leaveTypes: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useLeavePolicies = (
  params?: {
    leave_type_id?: string
    accrual_method?: string
    search?: string
  },
  enabled = true,
) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<LeavePolicy>>(
    () =>
      leaveApi.listLeavePolicies(request).then((response) => response.data.data.leave_policies),
    JSON.stringify(request),
    enabled,
  )
  return {
    leavePolicies: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const usePositionLeavePolicies = (
  positionId?: string,
  params?: {
    leave_policy_id?: string
    leave_type_id?: string
    status?: string
    effective_date?: string
  },
) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<PositionLeavePolicy>>(
    () =>
      positionId
        ? leaveApi
            .listPositionLeavePoliciesForPosition(positionId, request)
            .then((response) => response.data.data.position_leave_policies)
        : Promise.resolve({
            data: [],
            current_page: 1,
            last_page: 1,
            per_page: REFERENCE_PAGE_SIZE,
            total: 0,
            from: null,
            to: null,
            next_page_url: null,
            prev_page_url: null,
          } as Paginated<PositionLeavePolicy>),
    `${positionId ?? 'none'}:${JSON.stringify(request)}`,
  )
  return {
    positionLeavePolicies: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useCompanyPolicies = (params?: {
  search?: string
  category?: string
  status?: string
}) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<CompanyPolicy>>(
    () =>
      leaveApi.listCompanyPolicies(request).then((response) => response.data.data.company_policies),
    JSON.stringify(request),
  )
  return {
    companyPolicies: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useLeaveBalances = (params?: LeaveListParams) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<LeaveBalance>>(
    () =>
      leaveApi.listLeaveBalances(request).then((response) => response.data.data.leave_balances),
    JSON.stringify(request),
  )
  return {
    leaveBalances: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useMyLeaveBalances = (
  params?: { leave_year?: number },
  enabled = true,
) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<LeaveBalance>>(
    () =>
      leaveApi.listMyLeaveBalances(request).then((response) => response.data.data.leave_balances),
    `me:${JSON.stringify(request)}`,
    enabled,
  )
  return {
    leaveBalances: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useLeaveRequests = (params?: LeaveListParams) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<LeaveRequest>>(
    () =>
      leaveApi.listLeaveRequests(request).then((response) => response.data.data.leave_requests),
    JSON.stringify(request),
  )
  return {
    leaveRequests: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useMyLeaveRequests = (
  params?: { status?: string },
  enabled = true,
) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<LeaveRequest>>(
    () =>
      leaveApi.listMyLeaveRequests(request).then((response) => response.data.data.leave_requests),
    `me:${JSON.stringify(request)}`,
    enabled,
  )
  return {
    leaveRequests: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useLeaveApprovals = (params?: { approver_user_id?: string; manager_user_id?: string }) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<LeaveApproval>>(
    () =>
      leaveApi.listLeaveApprovals(request).then((response) => response.data.data.leave_approvals),
    JSON.stringify(request),
  )
  return {
    leaveApprovals: data?.data ?? [],
    loading,
    error,
    reload,
  }
}
