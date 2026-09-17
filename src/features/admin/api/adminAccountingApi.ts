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

export const adminAccountingApi = {
  async getIncomeEntries() {
    const response = await accountingClient.get<ProfitLossResponse>('/reports/profit-loss')
    return response.data
  },
}
