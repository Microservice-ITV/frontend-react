import type { AccountingOverviewData } from '../types/accountingTypes'

export const ACCOUNTING_OVERVIEW_MOCK: AccountingOverviewData = {
  summary: { totalRevenue: 84320, totalExpenses: 12650, netIncome: 71670, pendingEntries: 8 },
  position: { assets: 125400, liabilities: 38200, equity: 87200 },
  chart: {
    month: [
      { label: 'Sep 1', revenue: 9800, expenses: 1400, netIncome: 8400 },
      { label: 'Sep 5', revenue: 12400, expenses: 1800, netIncome: 10600 },
      { label: 'Sep 9', revenue: 10800, expenses: 1600, netIncome: 9200 },
      { label: 'Sep 13', revenue: 15600, expenses: 2300, netIncome: 13300 },
      { label: 'Sep 17', revenue: 13720, expenses: 1950, netIncome: 11770 },
    ],
    lastMonth: [
      { label: 'Aug 1', revenue: 15200, expenses: 2200, netIncome: 13000 },
      { label: 'Aug 8', revenue: 17800, expenses: 2600, netIncome: 15200 },
      { label: 'Aug 15', revenue: 19600, expenses: 2800, netIncome: 16800 },
      { label: 'Aug 22', revenue: 22100, expenses: 3100, netIncome: 19000 },
      { label: 'Aug 29', revenue: 19620, expenses: 2500, netIncome: 17120 },
    ],
    year: [
      { label: 'Jan', revenue: 48200, expenses: 9200, netIncome: 39000 },
      { label: 'Mar', revenue: 53700, expenses: 10100, netIncome: 43600 },
      { label: 'May', revenue: 64100, expenses: 11200, netIncome: 52900 },
      { label: 'Jul', revenue: 72800, expenses: 11800, netIncome: 61000 },
      { label: 'Sep', revenue: 84320, expenses: 12650, netIncome: 71670 },
    ],
  },
  journalEntries: [
    { id: 'JE-0008', date: 'Sep 17, 2026', description: 'Product sale', reference: 'ORD-1008', debit: 500, credit: 500, status: 'POSTED' },
    { id: 'JE-0007', date: 'Sep 16, 2026', description: 'Operating expense', reference: 'EXP-0021', debit: 1850, credit: 1850, status: 'POSTED' },
    { id: 'JE-0006', date: 'Sep 15, 2026', description: 'Product sale', reference: 'ORD-1007', debit: 720, credit: 720, status: 'PENDING' },
    { id: 'JE-0005', date: 'Sep 14, 2026', description: 'Supplier invoice', reference: 'BILL-0142', debit: 1250, credit: 1250, status: 'DRAFT' },
  ],
  accountBalances: [
    { name: 'Cash', balance: 58200 },
    { name: 'Accounts Receivable', balance: 31700 },
    { name: 'Accounts Payable', balance: 18200 },
    { name: 'Revenue', balance: 84320 },
    { name: 'Expenses', balance: 12650 },
  ],
  statusCounts: { POSTED: 124, DRAFT: 12, PENDING: 8, REVERSED: 3 },
}