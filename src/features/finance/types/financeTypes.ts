export type TransactionType = 'income' | 'expense'

export type TransactionStatus = 'completed' | 'pending' | 'failed'

export type Transaction = {
  id: string
  type: TransactionType
  description: string
  category: string
  amount: string
  status: TransactionStatus
  date: string
  dateValue: string
  reference?: string
}

export type FinanceSummary = {
  totalIncome: string
  totalExpenses: string
  netProfit: string
  pendingAmount: string
}
