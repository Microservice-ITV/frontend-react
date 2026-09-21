export type ExpenseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'RETURNED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export type ExpenseCategory = {
  id: string
  code: string
  name: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export type ExpenseAccount = {
  id: string
  code: string
  name: string
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
  status: string
  description: string | null
  parentId: string | null
  createdAt: string
  updatedAt: string
  parent: unknown
}

export type ExpenseJournalLine = {
  accountCode: string
  direction: 'DEBIT' | 'CREDIT'
  amount: number
  memo: string | null
}

export type ExpenseJournalEntry = {
  id: string
  referenceType: string
  referenceId: string
  eventId: string | null
  narration: string
  status: string
  lines: ExpenseJournalLine[]
}

export type AccountingExpense = {
  id: string
  expenseNo: string
  shopId: string | null
  sellerUserId: string | null
  expenseTypeId: string
  amount: string
  currency: string
  description: string | null
  expenseDate: string
  status: ExpenseStatus
  createdAt: string
  updatedAt: string
  submittedAt: string | null
}

export type CreateExpensePayload = {
  shopId: string
  amount: number
  expenseDate?: string
  expenseAccountCode: string
  fundingAccountCode: string
  eventId?: string
  expenseCategoryId: string
  description?: string
}

export type CreateExpenseResponse = {
  expense: AccountingExpense
  journalEntry: ExpenseJournalEntry
}

export type ExpenseApprovalSummary = {
  id: string
  stepNo: number
  approverUserId: string | null
  status: string
}

export type SubmitExpenseResponse = {
  expenseId: string
  status: ExpenseStatus
  approvals: ExpenseApprovalSummary[]
  policyId: string | null
}

export type AccountingJournalEntry = {
  id: string
  referenceType: string
  referenceId: string
  eventId: string | null
  narration: string | null
  entryDate: string
  status: string
  lines: Array<{
    id: string
    direction: 'DEBIT' | 'CREDIT'
    amount: number | string
    memo: string | null
    account: { code: string; name: string }
  }>
}
