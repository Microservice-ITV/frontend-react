import { describe, expect, it } from 'vitest'
import { getPostedExpenseTotal } from './SellerAccountingOverviewPage'

describe('accounting overview posted expense total', () => {
  it('excludes rejected and pending expenses', () => {
    expect(getPostedExpenseTotal([
      { amount: '100', status: 'APPROVED' },
      { amount: '200', status: 'REJECTED' },
      { amount: '300', status: 'PENDING_APPROVAL' },
    ] as any)).toBe(100)
  })
})