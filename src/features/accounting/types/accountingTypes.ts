export type AccountingStatus = 'POSTED' | 'DRAFT' | 'PENDING' | 'REVERSED'

export type AccountingSummary = {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  pendingEntries: number
}

export type FinancialPosition = {
  assets: number
  liabilities: number
  equity: number
}

export type AccountingChartPoint = {
  label: string
  revenue: number
  expenses: number
  netIncome: number
}

export type JournalEntry = {
  id: string
  date: string
  description: string
  reference: string
  debit: number
  credit: number
  status: AccountingStatus
}

export type AccountBalance = {
  name: string
  balance: number
}

export type AccountingOverviewData = {
  summary: AccountingSummary
  position: FinancialPosition
  chart: Record<'month' | 'lastMonth' | 'year', AccountingChartPoint[]>
  journalEntries: JournalEntry[]
  accountBalances: AccountBalance[]
  statusCounts: Record<AccountingStatus, number>
}