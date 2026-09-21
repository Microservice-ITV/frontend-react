import { accountingClient } from '@/lib/api/accountingClient'
import type {
  AccountingExpense,
  AccountingJournalEntry,
  CreateExpensePayload,
  CreateExpenseResponse,
  ExpenseAccount,
  ExpenseCategory,
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

  async submit(expenseId: string, actorUserId?: string): Promise<SubmitExpenseResponse> {
    const response = await accountingClient.post<SubmitExpenseResponse>(
      `/expenses/${encodeURIComponent(expenseId)}/submit`,
      actorUserId ? { actorUserId } : {},
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
    const response = await accountingClient.get<AccountingJournalEntry[]>('/entries')
    return response.data ?? []
  },
}
