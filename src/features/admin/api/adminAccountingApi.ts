import { accountingClient } from '@/lib/api/accountingClient'
import type {
  AccountingAccount,
  AccountingIncomeLine,
  ProfitLossOverviewResponse,
} from '@/features/accounting/types/accountingTypes'

export type { AccountingAccount, AccountingIncomeLine } from '@/features/accounting/types/accountingTypes'
export type ProfitLossResponse = ProfitLossOverviewResponse

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
  shopId?: string
  organizationId?: string
  sellerUserId?: string
  employeeId?: string
  organizationUnitId?: string
  organizationUnitOrganizationId?: string
}

export const adminAccountingApi = {
  async getIncomeEntries() {
    const response = await accountingClient.get<ProfitLossResponse>('/reports/profit-loss')
    return response.data
  },

  async getProfitLoss(params?: {
    from?: string
    to?: string
    shopId?: string
    groupBy?: 'day' | 'month'
  }) {
    const response = await accountingClient.get<ProfitLossResponse>('/reports/profit-loss', { params })
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
