export type AccountingStatus = 'POSTED' | 'DRAFT' | 'PENDING' | 'REVERSED'

export type AccountingAccount = {
  code: string
  name: string
  type: string
}

export type AccountingIncomeLine = {
  id: string
  shopId?: string | null
  direction: string
  amount: number | string
  currency?: string
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

export type ProfitLossCurrencyReport = {
  currency: string
  complete: boolean
  missingComponents: string[]
  revenue: {
    grossSales: number
    discounts: number | null
    netSales: number | null
    refunds: null
    tax: null
    platformFundedItemDiscounts: number | null
    sellerFundedShippingDiscounts: number | null
    platformFundedShippingDiscounts: number | null
  }
  actualRevenue: number
  refunds: null
  tax: null
  expenses: {
    operatingExpenses: number
    cogs: null
    paymentFees: null
    commission: null
    shipping: null
  }
  profit: {
    currentProfitOrLoss: number
    grossProfit: null
    netProfit: null
    ledgerProfit: {
      totalIncome: number
      totalExpense: number
      netProfit: number
      label: string
    }
  }
  commissionStatus: string
  breakdown: ProfitLossBreakdownPoint[]
}

export type ProfitLossBreakdownPoint = {
  period: string
  grossSales: number
  discounts: number | null
  refunds: null
  cogs: null
  paymentFees: null
  shipping: null
  platformFundedItemDiscounts: number | null
  sellerFundedShippingDiscounts: number | null
  platformFundedShippingDiscounts: number | null
  actualRevenue: number
  operatingExpenses: number
  currentProfitOrLoss: number
}

export type ProfitLossOverviewResponse = {
  totalIncome: number | null
  entries: AccountingIncomeLine[]
  totalExpense: number | null
  netProfit: number | null
  complete: boolean
  groupBy: 'day' | 'month'
  currency: string | null
  refunds: null
  tax: null
  cogs: null
  paymentFees: null
  commission: null
  missingComponents: string[]
  commissionStatus: string
  reports: ProfitLossCurrencyReport[]
}