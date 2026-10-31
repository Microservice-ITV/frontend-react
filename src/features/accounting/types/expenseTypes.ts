export type ExpenseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING'
  | 'PENDING_APPROVAL'
  | 'WAITING'
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
  scope?: 'SHOP' | 'PLATFORM'
  shopId: string | null
  createdByUserId?: string | null
  sellerUserId: string | null
  expenseTypeId: string
  amount: string
  currency: string
  description: string | null
  receiptImage?: string | null
  expenseDate: string
  status: ExpenseStatus
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  approvedAt?: string | null
  expenseType?: ExpenseCategory
  journalEntry?: AccountingJournalEntry | null
  approvedAt?: string | null
}

export type CreateExpensePayload = {
  scope?: 'SHOP' | 'PLATFORM'
  shopId?: string | null
  amount: number
  expenseDate?: string
  expenseAccountCode: string
  fundingAccountCode: string
  eventId?: string
  expenseCategoryId: string
  description?: string
  receiptImage?: string
}

export type CreateExpenseResponse = {
  expense: AccountingExpense
  journalEntry: ExpenseJournalEntry | null
}

export type ExpenseApprovalSummary = {
  id: string
  expenseId: string
  stepNo: number
  approverUserId: string | null
  status: string
  action: string | null
  comment: string | null
  approvedAt: string | null
  rejectedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ExpenseApprovalStatusResponse = {
  expenseId: string
  status: ExpenseStatus
  approvals: ExpenseApprovalSummary[]
}

export type SubmitExpenseResponse = {
  expenseId: string
  status: ExpenseStatus
  approvals: ExpenseApprovalSummary[]
  policyId: string | null
}

export type PendingApprovalRecord = {
  id: string
  expenseId: string
  stepNo: number
  approverUserId: string | null
  status: string
  action: string | null
  comment: string | null
  approvedAt: string | null
  rejectedAt: string | null
  createdAt: string
  updatedAt: string
  expense: AccountingExpense
}

export type PendingApprovalsResponse = {
  approvals: PendingApprovalRecord[]
}

export type ApprovalPolicyCondition = {
  id: string
  field: string
  operator: string
  value: string
}

export type ApprovalPolicy = {
  id: string
  name: string
  scope?: 'SHOP' | 'PLATFORM'
  shopId?: string | null
  approverUserId?: string | null
  minAmount: string
  maxAmount: string | null
  level: number
  isActive: boolean
  conditions: ApprovalPolicyCondition[]
}

export type ApprovalPolicyInput = {
  scope?: 'SHOP' | 'PLATFORM'
  shopId?: string | null
  name: string
  minAmount: number
  maxAmount?: number | null
  level?: number
  isActive?: boolean
}

export type ExpenseActionResponse = {
  expenseId: string
  approvalId?: string
  status: string
  expenseStatus?: string
  currentApproval?: ExpenseApprovalSummary
  nextApproval?: ExpenseApprovalSummary | null
  nextApprovalId?: string
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
