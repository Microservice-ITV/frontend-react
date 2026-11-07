export type ArApBucket = 'receivables' | 'cod_clearing' | 'payables' | 'deferred_revenue' | 'recorded_receipts'

export type ArApAccountBalance = {
  accountCode: string
  accountName: string
  bucket: ArApBucket
  shopId: string | null
  currency: string | null
  debit: number
  credit: number
  balance: number
  lineCount: number
  balanceMeaning: string
}

export type ArApReceivableItem = {
  accountCode: '1100' | '1200'
  shopId: string | null
  currency: string | null
  orderId: string | null
  customerId: null
  customerIdentityAvailable: false
  debitRecognized: number
  creditsPostedToReceivable: number
  outstandingBalance: number
  status: string
  sourceReferences: Array<{ referenceType: string; referenceId: string }>
}

export type ArApRecordedReceipt = {
  shopId: string | null
  currency: string | null
  paymentReference: string
  orderId: string | null
  amount: number
  journalIds: string[]
  sourceReferences: Array<{ referenceType: string; referenceId: string }>
  evidenceStatus: string
  meaning: string
}

export type ArApJournalLine = {
  accountCode: string
  accountName: string
  bucket: ArApBucket | 'other_journal_line'
  direction: 'DEBIT' | 'CREDIT'
  amount: number
  currency: string | null
  shopId: string | null
  memo: string | null
  payableClassification?: string
}

export type ArApTransaction = {
  journalId: string
  referenceType: string
  referenceId: string
  eventId: string | null
  narration: string | null
  entryDate: string
  createdAt: string
  status: string
  journalCompleteness: 'FULL_JOURNAL' | 'AUTHORIZED_SHOP_LINES_ONLY'
  lines: ArApJournalLine[]
}

export type ArApSettlement = {
  paymentReference: string
  orderId: string | null
  checkoutId: string | null
  eventId: string | null
  status: string
  currency: string
  createdAt: string
  shopAllocations: Array<{
    shopId: string | null
    currency: string | null
    grossAmount: number
    payableAmount: number
  }>
  meaning: string
}

export type ArApSummaryResponse = {
  asOf: string
  scope: { type: 'platform' } | { type: 'authorized_shops'; shopIds: string[] }
  source: 'POSTED_ACCOUNTING_JOURNAL_LINES'
  currencyPolicy: string
  accountBalances: ArApAccountBalance[]
  receivableItems: ArApReceivableItem[]
  codCollectionClearing: {
    accountCode: '1210'
    balanceRows: ArApAccountBalance[]
    evidenceNote: string
  }
  payables: {
    accountBalances: ArApAccountBalance[]
    payeeIdentityAvailable: false
    obligationDetailAvailable: false
    partialSettlementAllocationAvailable: false
    expenseApAvailable: false
    expenseApLimitation: string
    note: string
  }
  recordedSettlements: ArApSettlement[]
  recordedReceipts: ArApRecordedReceipt[]
  paymentAllocations: { available: false; reason: string }
  expectedIncome: { available: false; reason: string }
  aging: { available: false; reason: string }
  missingAttribution: Array<{
    journalId: string
    referenceType: string
    referenceId: string
    accountCode: string
    shopId: string | null
    currency: string | null
    reason: string
  }>
}

export type ArApTransactionsResponse = {
  transactions: ArApTransaction[]
  total: number
  limit: number
  offset: number
  scope:
    | { type: 'platform' }
    | { type: 'authorized_shops'; shopIds: string[] }
}

export type ArApAgingResponse = {
  asOf: string
  available: boolean
  reason?: string
  buckets: Record<string, number> | null
  scope:
    | { type: 'platform' }
    | { type: 'authorized_shops'; shopIds: string[] }
  currencyPolicy: string
}

export type ArApScopeQuery = {
  shopId?: string
}

export type ArApSummaryQuery = ArApScopeQuery & {
  currency?: string
}

export type ArApTransactionsQuery = ArApScopeQuery & {
  currency?: string
  bucket?: ArApBucket
  limit: number
  offset: number
}
