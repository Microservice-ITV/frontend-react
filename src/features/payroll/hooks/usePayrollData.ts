import { useCallback, useEffect, useRef, useState } from 'react'
import { payrollApi, payrollErrorMessage } from '../api/payrollApi'
import type {
  Paginated,
  PaymentListParams,
  PaymentRecord,
  Payslip,
  PayslipListParams,
  PayrollAuditLog,
  PayrollItem,
  PayrollPolicy,
  PayrollRun,
  PayrollRunListParams,
} from '../types/payrollTypes'

const REFERENCE_PAGE_SIZE = 200

type Resource<T> = {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

const useResource = <T,>(loader: () => Promise<T>, key: string): Resource<T> => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
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
      setError(payrollErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, key])

  return { data, loading, error, reload: load }
}

export const usePayrollPolicies = (params?: {
  shop_id?: string
  is_active?: boolean
}) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<PayrollPolicy>>(
    () => payrollApi.listPolicies(request).then((response) => response.data.data.payroll_policies),
    JSON.stringify(request),
  )
  return {
    payrollPolicies: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const usePayrollRuns = (params?: PayrollRunListParams) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<PayrollRun>>(
    () => payrollApi.listRuns(request).then((response) => response.data.data.payroll_runs),
    JSON.stringify(request),
  )
  return {
    payrollRuns: data?.data ?? [],
    meta: data
      ? {
          current_page: data.current_page,
          last_page: data.last_page,
          per_page: data.per_page,
          total: data.total,
        }
      : null,
    loading,
    error,
    reload,
  }
}

export const usePayrollRun = (id?: string | null) => {
  const { data, loading, error, reload } = useResource<PayrollRun>(
    () => payrollApi.getRun(id as string).then((response) => response.data.data.payroll_run),
    `run:${id}`,
  )
  return {
    payrollRun: id ? data : null,
    loading,
    error,
    reload,
  }
}

export const usePayrollRunItems = (id?: string | null) => {
  const request = { per_page: REFERENCE_PAGE_SIZE }
  const { data, loading, error, reload } = useResource<Paginated<PayrollItem>>(
    () =>
      payrollApi.listRunItems(id as string, request).then((response) => response.data.data.payroll_items),
    `items:${id}`,
  )
  return {
    payrollItems: id ? (data?.data ?? []) : [],
    loading,
    error,
    reload,
  }
}

export const usePayrollAuditLogs = (id?: string | null) => {
  const { data, loading, error, reload } = useResource<PayrollAuditLog[]>(
    () =>
      payrollApi.listRunAudit(id as string).then((response) => response.data.data.payroll_audit_logs),
    `audit:${id}`,
  )
  return {
    auditLogs: id ? (data ?? []) : [],
    loading,
    error,
    reload,
  }
}

export const usePayslips = (params?: PayslipListParams) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<Payslip>>(
    () => payrollApi.listPayslips(request).then((response) => response.data.data.payslips),
    JSON.stringify(request),
  )
  return {
    payslips: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const useMyPayslips = () => {
  const request = { per_page: REFERENCE_PAGE_SIZE }
  const { data, loading, error, reload } = useResource<Paginated<Payslip>>(
    () => payrollApi.listMyPayslips(request).then((response) => response.data.data.payslips),
    'my-payslips',
  )
  return {
    payslips: data?.data ?? [],
    loading,
    error,
    reload,
  }
}

export const usePaymentRecords = (params?: PaymentListParams) => {
  const request = { per_page: REFERENCE_PAGE_SIZE, ...params }
  const { data, loading, error, reload } = useResource<Paginated<PaymentRecord>>(
    () =>
      payrollApi.listPayments(request).then((response) => response.data.data.payment_records),
    JSON.stringify(request),
  )
  return {
    paymentRecords: data?.data ?? [],
    loading,
    error,
    reload,
  }
}
