import { accountingClient } from '@/lib/api/accountingClient'

export type AccountingAccount = {
  code: string
  name: string
  type: string
}

export type AccountingIncomeLine = {
  id: string
  direction: string
  amount: number | string
  memo: string | null
  account: AccountingAccount
  journalEntry: {
    referenceType: string
    referenceId: string
    narration: string | null
    entryDate: string
    status: string
  }
}

export type ProfitLossResponse = {
  totalIncome: number | string
  entries: AccountingIncomeLine[]
}

export type ExpenseCategory = {
  id: string
  code: string
  name: string
  description: string | null
  status: string
}

export type CreateExpensePayload = {
  amount: number
  expenseDate?: string
  expenseAccountCode?: string
  fundingAccountCode?: string
  eventId?: string
  expenseCategoryId?: string
  category?: string
  description?: string
}

export const adminAccountingApi = {
  async getIncomeEntries() {
    const response = await accountingClient.get<ProfitLossResponse>('/reports/profit-loss')
    return response.data
  },

  async getExpenseCategories() {
    const response = await accountingClient.get<{ categories: ExpenseCategory[] }>('/expenses/categories')
    return response.data.categories
  },

  async createExpenseCategory(payload: Omit<ExpenseCategory, 'id'>) {
    const response = await accountingClient.post<ExpenseCategory>('/expenses/categories', payload)
    return response.data
  },

  async updateExpenseCategory(id: string, payload: Omit<ExpenseCategory, 'id'>) {
    const response = await accountingClient.patch<ExpenseCategory>(`/expenses/categories/${encodeURIComponent(id)}`, payload)
    return response.data
  },

  async deleteExpenseCategory(id: string) {
    await accountingClient.delete(`/expenses/categories/${encodeURIComponent(id)}`)
  },

  async createExpense(payload: CreateExpensePayload) {
    const response = await accountingClient.post('/expenses', payload)
    return response.data
  },
}
