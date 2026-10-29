import type { AxiosError } from 'axios'
import { employeeClient } from '@/lib/api/employeeClient'
import type {
  BonusAward,
  BonusAwardListParams,
  BonusPolicy,
  BonusPolicyPayload,
  CycleKpiPayload,
  EmployeeGoal,
  EmployeeGoalListParams,
  EmployeeGoalPayload,
  Kpi,
  KpiPayload,
  Paginated,
  PerformanceCycle,
  PerformanceCycleListParams,
  PerformanceCyclePayload,
  PerformanceReview,
  PerformanceReviewListParams,
  ReviewScorePayload,
} from '../types/performanceTypes'

type Envelope<T> = { success: boolean; data: T }

export const performanceErrorMessage = (error: unknown): string => {
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

const cleanParams = (params?: object) => {
  if (!params) return undefined
  const entries = Object.entries(params as Record<string, unknown>).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  )
  return Object.fromEntries(entries)
}

export const performanceApi = {
  // --- Performance cycles ---
  listCycles: (params?: PerformanceCycleListParams) =>
    employeeClient.get<Envelope<{ performance_cycles: Paginated<PerformanceCycle> }>>('/performance-cycles', {
      params: cleanParams(params),
    }),
  getCycle: (id: string) =>
    employeeClient.get<Envelope<{ performance_cycle: PerformanceCycle }>>(`/performance-cycles/${id}`),
  createCycle: (payload: PerformanceCyclePayload) =>
    employeeClient.post<Envelope<{ performance_cycle: PerformanceCycle }>>('/performance-cycles', payload),
  updateCycle: (id: string, payload: Partial<PerformanceCyclePayload>) =>
    employeeClient.put<Envelope<{ performance_cycle: PerformanceCycle }>>(`/performance-cycles/${id}`, payload),
  deleteCycle: (id: string) =>
    employeeClient.delete<Envelope<{ message: string }>>(`/performance-cycles/${id}`),
  setCycleKpis: (id: string, kpis: CycleKpiPayload[]) =>
    employeeClient.put<Envelope<{ performance_cycle: PerformanceCycle }>>(`/performance-cycles/${id}/kpis`, { kpis }),
  activateCycle: (id: string) =>
    employeeClient.post<Envelope<{ performance_cycle: PerformanceCycle }>>(`/performance-cycles/${id}/activate`),
  closeCycle: (id: string) =>
    employeeClient.post<Envelope<{ performance_cycle: PerformanceCycle }>>(`/performance-cycles/${id}/close`),

  // --- KPIs ---
  listKpis: (params?: { search?: string; is_active?: boolean; per_page?: number }) =>
    employeeClient.get<Envelope<{ kpis: Paginated<Kpi> }>>('/kpis', { params: cleanParams(params) }),
  getKpi: (id: string) =>
    employeeClient.get<Envelope<{ kpi: Kpi }>>(`/kpis/${id}`),
  createKpi: (payload: KpiPayload) =>
    employeeClient.post<Envelope<{ kpi: Kpi }>>('/kpis', payload),
  updateKpi: (id: string, payload: Partial<KpiPayload>) =>
    employeeClient.put<Envelope<{ kpi: Kpi }>>(`/kpis/${id}`, payload),
  deleteKpi: (id: string) =>
    employeeClient.delete<Envelope<{ message: string }>>(`/kpis/${id}`),

  // --- Employee goals ---
  listGoals: (params?: EmployeeGoalListParams) =>
    employeeClient.get<Envelope<{ employee_goals: Paginated<EmployeeGoal> }>>('/employee-goals', {
      params: cleanParams(params),
    }),
  listMyGoals: (params?: Omit<EmployeeGoalListParams, 'employee_id'>) =>
    employeeClient.get<Envelope<{ employee_goals: Paginated<EmployeeGoal> }>>('/employee-goals/me', {
      params: cleanParams(params),
    }),
  createGoal: (payload: EmployeeGoalPayload) =>
    employeeClient.post<Envelope<{ employee_goal: EmployeeGoal }>>('/employee-goals', payload),
  updateGoal: (id: string, payload: Partial<EmployeeGoalPayload> & { progress_percentage?: number; status?: string }) =>
    employeeClient.put<Envelope<{ employee_goal: EmployeeGoal }>>(`/employee-goals/${id}`, payload),
  deleteGoal: (id: string) =>
    employeeClient.delete<Envelope<{ message: string }>>(`/employee-goals/${id}`),

  // --- Performance reviews ---
  listReviews: (params?: PerformanceReviewListParams) =>
    employeeClient.get<Envelope<{ performance_reviews: Paginated<PerformanceReview> }>>('/performance-reviews', {
      params: cleanParams(params),
    }),
  listMyReviews: (params?: Omit<PerformanceReviewListParams, 'employee_id'>) =>
    employeeClient.get<Envelope<{ performance_reviews: Paginated<PerformanceReview> }>>('/performance-reviews/me', {
      params: cleanParams(params),
    }),
  getReview: (id: string) =>
    employeeClient.get<Envelope<{ performance_review: PerformanceReview }>>(`/performance-reviews/${id}`),
  createReview: (payload: { employee_id: string; performance_cycle_id: string }) =>
    employeeClient.post<Envelope<{ performance_review: PerformanceReview }>>('/performance-reviews', payload),
  scoreReview: (id: string, scores: ReviewScorePayload[]) =>
    employeeClient.post<Envelope<{ performance_review: PerformanceReview }>>(`/performance-reviews/${id}/score`, { scores }),
  submitReview: (id: string) =>
    employeeClient.post<Envelope<{ performance_review: PerformanceReview }>>(`/performance-reviews/${id}/submit`),
  employeeReview: (id: string, comments?: string | null) =>
    employeeClient.post<Envelope<{ performance_review: PerformanceReview }>>(`/performance-reviews/${id}/employee-review`, {
      employee_comments: comments ?? null,
    }),
  finalizeReview: (id: string, feedback?: string | null) =>
    employeeClient.post<Envelope<{ performance_review: PerformanceReview }>>(`/performance-reviews/${id}/finalize`, {
      manager_feedback: feedback ?? null,
    }),

  // --- Bonus policies ---
  listBonusPolicies: (params?: { search?: string; per_page?: number }) =>
    employeeClient.get<Envelope<{ bonus_policies: Paginated<BonusPolicy> }>>('/bonus-policies', {
      params: cleanParams(params),
    }),
  createBonusPolicy: (payload: BonusPolicyPayload) =>
    employeeClient.post<Envelope<{ bonus_policy: BonusPolicy }>>('/bonus-policies', payload),
  updateBonusPolicy: (id: string, payload: Partial<BonusPolicyPayload>) =>
    employeeClient.put<Envelope<{ bonus_policy: BonusPolicy }>>(`/bonus-policies/${id}`, payload),
  deleteBonusPolicy: (id: string) =>
    employeeClient.delete<Envelope<{ message: string }>>(`/bonus-policies/${id}`),

  // --- Bonus awards ---
  listBonusAwards: (params?: BonusAwardListParams) =>
    employeeClient.get<Envelope<{ bonus_awards: Paginated<BonusAward> }>>('/bonus-awards', {
      params: cleanParams(params),
    }),
  listMyBonusAwards: (params?: Omit<BonusAwardListParams, 'employee_id'>) =>
    employeeClient.get<Envelope<{ bonus_awards: Paginated<BonusAward> }>>('/bonus-awards/me', {
      params: cleanParams(params),
    }),
  getBonusAward: (id: string) =>
    employeeClient.get<Envelope<{ bonus_award: BonusAward }>>(`/bonus-awards/${id}`),
  proposeBonusForReview: (performanceReviewId: string) =>
    employeeClient.post<Envelope<{ bonus_award: BonusAward | null; applies: boolean }>>(
      `/performance-reviews/${performanceReviewId}/propose-bonus`,
    ),
  proposeBonusesForCycle: (performanceCycleId: string) =>
    employeeClient.post<Envelope<{ bonus_awards: BonusAward[]; count: number }>>(
      `/performance-cycles/${performanceCycleId}/propose-bonuses`,
    ),
  approveBonusAward: (id: string, approvedAmount?: number | null) =>
    employeeClient.post<Envelope<{ bonus_award: BonusAward }>>(`/bonus-awards/${id}/approve`, {
      approved_amount: approvedAmount ?? null,
    }),
  rejectBonusAward: (id: string) =>
    employeeClient.post<Envelope<{ bonus_award: BonusAward }>>(`/bonus-awards/${id}/reject`),
  syncBonusAwardToPayroll: (id: string, payrollRunId: string) =>
    employeeClient.post<Envelope<{ bonus_award: BonusAward }>>(`/bonus-awards/${id}/sync-to-payroll`, {
      payroll_run_id: payrollRunId,
    }),
}
