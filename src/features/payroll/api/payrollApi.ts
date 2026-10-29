import type { AxiosError } from 'axios'
import { employeeClient } from '@/lib/api/employeeClient'
import { accountingClient } from '@/lib/api/accountingClient'
import type {
  Paginated,
  PaymentListParams,
  PaymentRecord,
  PaymentRecordPayload,
  PaymentStatus,
  Payslip,
  PayslipListParams,
  PayrollAdjustmentPayload,
  PayrollAuditLog,
  PayrollItem,
  PayrollPolicy,
  PayrollPolicyPayload,
  PayrollRun,
  PayrollRunListParams,
  PayrollRunPayload,
} from '../types/payrollTypes'

type Envelope<T> = { success: boolean; data: T }

const payrollErrorMessage = (error: unknown): string => {
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

// Export the payrollApi object with all functions for backward compatibility
// This maintains the same API shape as before the migration
export const payrollApi = {
  // --- Payroll policies ---
  listPolicies: (params?: { shop_id?: string; is_active?: boolean; per_page?: number }) =>
    accountingClient.get<Envelope<{ payroll_policies: Paginated<PayrollPolicy> }>>(
      '/payroll-policies',
      { params: cleanParams(params as Record<string, unknown>) }
    ),
  getPolicy: (id: string) =>
    accountingClient.get<Envelope<{ payroll_policy: PayrollPolicy }>>(`/payroll-policies/${id}`),
  createPolicy: (payload: PayrollPolicyPayload) =>
    accountingClient.post<Envelope<{ payroll_policy: PayrollPolicy }>>('/payroll-policies', payload),
  updatePolicy: (id: string, payload: Partial<PayrollPolicyPayload>) =>
    accountingClient.put<Envelope<{ payroll_policy: PayrollPolicy }>>(`/payroll-policies/${id}`, payload),
  deletePolicy: (id: string) =>
    accountingClient.delete<Envelope<{ message: string }>>(`/payroll-policies/${id}`),

  // --- Payroll runs ---
  listRuns: (params?: PayrollRunListParams) =>
    accountingClient.get<Envelope<{ payroll_runs: Paginated<PayrollRun> }>>('/payroll-runs', {
      params: cleanParams(params as Record<string, unknown>),
    }),
  getRun: (id: string) =>
    accountingClient.get<Envelope<{ payroll_run: PayrollRun }>>(`/payroll-runs/${id}`),
  createRun: (payload: PayrollRunPayload) =>
    accountingClient.post<Envelope<{ payroll_run: PayrollRun }>>('/payroll-runs', payload),
  calculateRun: (id: string) =>
    accountingClient.post<Envelope<{ payroll_run: PayrollRun }>>(`/payroll-runs/${id}/calculate`),
  submitRun: (id: string) =>
    accountingClient.post<Envelope<{ payroll_run: PayrollRun }>>(`/payroll-runs/${id}/submit`),
  approveRun: (id: string, comment?: string | null) =>
    accountingClient.post<Envelope<{ payroll_run: PayrollRun }>>(
      `/payroll-runs/${id}/approve`,
      { comment: comment ?? null }
    ),
  rejectRun: (id: string, comment?: string | null) =>
    accountingClient.post<Envelope<{ payroll_run: PayrollRun }>>(
      `/payroll-runs/${id}/reject`,
      { comment: comment ?? null }
    ),
  payRun: (id: string) =>
    accountingClient.post<Envelope<{ payroll_run: PayrollRun }>>(`/payroll-runs/${id}/pay`),
  voidRun: (id: string, reason?: string | null) =>
    accountingClient.post<Envelope<{ payroll_run: PayrollRun }>>(`/payroll-runs/${id}/void`, {
      reason: reason ?? null,
    }),
  listRunItems: (id: string, params?: { per_page?: number }) =>
    accountingClient.get<Envelope<{ payroll_items: Paginated<PayrollItem> }>>(
      `/payroll-runs/${id}/items`,
      { params: cleanParams(params as Record<string, unknown>) }
    ),
  listRunAudit: (id: string) =>
    accountingClient.get<Envelope<{ payroll_audit_logs: PayrollAuditLog[] }>>(
      `/payroll-runs/${id}/audit-logs`
    ),

  // --- Payroll item adjustments ---
  addAdjustment: (runId: string, itemId: string, payload: PayrollAdjustmentPayload) =>
    accountingClient.post<Envelope<{ payroll_item: PayrollItem }>>(
      `/payroll-runs/${runId}/items/${itemId}/lines`,
      payload
    ),
  removeAdjustment: (runId: string, itemId: string, lineId: string) =>
    accountingClient.delete<Envelope<{ payroll_item: PayrollItem }>>(
      `/payroll-runs/${runId}/items/${itemId}/lines/${lineId}`
    ),

  // --- Payslips ---
  listPayslips: (params?: PayslipListParams) =>
    accountingClient.get<Envelope<{ payslips: Paginated<Payslip> }>>('/payslips', {
      params: cleanParams(params as Record<string, unknown>),
    }),
  listMyPayslips: (params?: { per_page?: number }) =>
    accountingClient.get<Envelope<{ payslips: Paginated<Payslip> }>>('/payslips/me', {
      params: cleanParams(params as Record<string, unknown>),
    }),
  getPayslip: (id: string) =>
    accountingClient.get<Envelope<{ payslip: Payslip }>>(`/payslips/${id}`),
  generatePayslips: (runId: string) =>
    accountingClient.post<Envelope<{ payslips: Payslip[] }>>(`/payroll-runs/${runId}/payslips`),
  issuePayslip: (id: string) =>
    accountingClient.post<Envelope<{ payslip: Payslip }>>(`/payslips/${id}/issue`),
  revokePayslip: (id: string) =>
    accountingClient.post<Envelope<{ payslip: Payslip }>>(`/payslips/${id}/revoke`),

  // --- Payment records ---
  listPayments: (params?: PaymentListParams) =>
    accountingClient.get<Envelope<{ payment_records: Paginated<PaymentRecord> }>>(
      '/payment-records',
      { params: cleanParams(params as Record<string, unknown>) }
    ),
  listRunPayments: (runId: string) =>
    accountingClient.get<Envelope<{ payment_records: PaymentRecord[] }>>(
      `/payroll-runs/${runId}/payments`
    ),
  recordPayment: (runId: string, payload: PaymentRecordPayload) =>
    accountingClient.post<Envelope<{ payment_record: PaymentRecord }>>(
      `/payroll-runs/${runId}/payments`,
      payload
    ),
  updatePaymentStatus: (id: string, status: PaymentStatus) =>
    accountingClient.patch<Envelope<{ payment_record: PaymentRecord }>>(
      `/payment-records/${id}/status`,
      { status }
    ),
}

// Keep the error message function for consumers that import it directly
// Re-export for consumers that import payrollErrorMessage directly
export { payrollErrorMessage }

// Named exports for the clients (useful for advanced usage)
export { accountingClient, employeeClient }