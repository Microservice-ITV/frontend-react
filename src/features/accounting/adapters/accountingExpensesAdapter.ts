import { accountingClient } from '@/lib/api/accountingClient'
import { ecommerceReadRestClient } from '@/lib/api/ecommerceReadRestClient'
import type {
  AccountingExpense,
  AccountingJournalEntry,
  ApprovalPolicy,
  ApprovalPolicyInput,
  CreateExpensePayload,
  CreateExpenseResponse,
  ExpenseAccount,
  ExpenseActionResponse,
  ExpenseApprovalStatusResponse,
  ExpenseCategory,
  PendingApprovalsResponse,
  SubmitExpenseResponse,
} from '../types/expenseTypes'

export const accountingExpensesAdapter = {
  async list(): Promise<AccountingExpense[]> {
    const response = await accountingClient.get<AccountingExpense[]>('/expenses')
    return response.data ?? []
  },

  async getByReference(referenceId: string): Promise<AccountingExpense> {
    const response = await accountingClient.get<AccountingExpense>(
      `/expenses/reference/${encodeURIComponent(referenceId)}`,
    )
    return response.data
  },

  async create(payload: CreateExpensePayload): Promise<CreateExpenseResponse> {
    const response = await accountingClient.post<CreateExpenseResponse>('/expenses', payload)
    return response.data
  },

  async updateReturned(expenseId: string, payload: CreateExpensePayload): Promise<AccountingExpense> {
    const response = await accountingClient.patch<AccountingExpense>(
      `/expenses/${encodeURIComponent(expenseId)}`,
      payload,
    )
    return response.data
  },

  async submit(expenseId: string, actorUserId?: string): Promise<SubmitExpenseResponse> {
    const response = await accountingClient.post<SubmitExpenseResponse>(
      `/expenses/${encodeURIComponent(expenseId)}/submit`,
      actorUserId ? { actorUserId } : {},
    )
    return response.data
  },

  async getApprovalStatus(expenseId: string): Promise<ExpenseApprovalStatusResponse> {
    const response = await accountingClient.get<ExpenseApprovalStatusResponse>(
      `/expenses/${encodeURIComponent(expenseId)}/approval-status`,
    )
    return response.data
  },

  async listPendingApprovals() {
    const response = await accountingClient.get<PendingApprovalsResponse>('/expenses/pending-approvals')
    return response.data.approvals ?? []
  },

  async listApprovalPolicies(shopId?: string, scope: 'SHOP' | 'PLATFORM' = 'SHOP'): Promise<ApprovalPolicy[]> {
    const params = scope === 'PLATFORM' ? { scope } : { shopId }
    const response = await accountingClient.get<{ policies: ApprovalPolicy[] }>('/approval-policies', { params })
    return response.data.policies ?? []
  },

  async getApprovalPolicy(id: string, shopId?: string, scope: 'SHOP' | 'PLATFORM' = 'SHOP'): Promise<ApprovalPolicy> {
    const params = scope === 'PLATFORM' ? { scope } : { shopId }
    const response = await accountingClient.get<ApprovalPolicy>(`/approval-policies/${encodeURIComponent(id)}`, { params })
    return response.data
  },

  async createApprovalPolicy(payload: ApprovalPolicyInput): Promise<ApprovalPolicy> {
    const response = await accountingClient.post<ApprovalPolicy>('/approval-policies', payload)
    return response.data
  },

  async updateApprovalPolicy(id: string, payload: ApprovalPolicyInput): Promise<ApprovalPolicy> {
    const response = await accountingClient.patch<ApprovalPolicy>(`/approval-policies/${encodeURIComponent(id)}`, payload)
    return response.data
  },

  async setApprovalPolicyActive(id: string, shopId: string | undefined, isActive: boolean, scope: 'SHOP' | 'PLATFORM' = 'SHOP'): Promise<ApprovalPolicy> {
    const params = scope === 'PLATFORM' ? { scope } : { shopId }
    const response = await accountingClient.patch<ApprovalPolicy>(`/approval-policies/${encodeURIComponent(id)}/status`, { isActive }, { params })
    return response.data
  },

  async deleteApprovalPolicy(id: string, shopId?: string, scope: 'SHOP' | 'PLATFORM' = 'SHOP'): Promise<void> {
    const params = scope === 'PLATFORM' ? { scope } : { shopId }
    await accountingClient.delete(`/approval-policies/${encodeURIComponent(id)}`, { params })
  },

  async approveExpense(expenseId: string, approvalId: string, comment?: string): Promise<ExpenseActionResponse> {
    const response = await accountingClient.post<ExpenseActionResponse>(
      `/expenses/${encodeURIComponent(expenseId)}/approvals/${encodeURIComponent(approvalId)}/approve`,
      comment ? { comment } : {},
    )
    return response.data
  },

  async rejectExpense(expenseId: string, approvalId: string, comment?: string): Promise<ExpenseActionResponse> {
    const response = await accountingClient.post<ExpenseActionResponse>(
      `/expenses/${encodeURIComponent(expenseId)}/approvals/${encodeURIComponent(approvalId)}/reject`,
      comment ? { comment } : {},
    )
    return response.data
  },

  async returnExpense(expenseId: string, approvalId: string, comment?: string): Promise<ExpenseActionResponse> {
    const response = await accountingClient.post<ExpenseActionResponse>(
      `/expenses/${encodeURIComponent(expenseId)}/approvals/${encodeURIComponent(approvalId)}/return`,
      comment ? { comment } : {},
    )
    return response.data
  },

  async listCategories(): Promise<ExpenseCategory[]> {
    const response = await accountingClient.get<{ categories: ExpenseCategory[] }>('/expenses/categories')
    return response.data.categories ?? []
  },

  async listAccounts(): Promise<ExpenseAccount[]> {
    const response = await accountingClient.get<ExpenseAccount[]>('/accounts')
    return response.data ?? []
  },

  async listJournalEntries(): Promise<AccountingJournalEntry[]> {
    const response = await ecommerceReadRestClient.get<AccountingJournalEntry[]>('/accounting/entries')
    return response.data ?? []
  },
}
