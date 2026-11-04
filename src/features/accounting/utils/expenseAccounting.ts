import type { AccountingExpense } from '../types/expenseTypes'

export const isExpenseInAccounting = (
  expense: Pick<AccountingExpense, 'status'> & {
    expenseType?: { code?: string | null } | null
  },
  categoryCode?: string,
): boolean =>
  expense.status === 'APPROVED'
  || (expense.expenseType?.code ?? categoryCode)?.trim().toUpperCase() === 'DELI'
