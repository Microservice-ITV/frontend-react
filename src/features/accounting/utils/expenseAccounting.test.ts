import { describe, expect, it } from 'vitest'
import { isExpenseInAccounting } from './expenseAccounting'

describe('isExpenseInAccounting', () => {
  it('includes approved expenses regardless of category', () => {
    expect(isExpenseInAccounting({ status: 'APPROVED' })).toBe(true)
  })

  it('includes DELI expenses before approval', () => {
    expect(isExpenseInAccounting(
      { status: 'PENDING_APPROVAL', expenseType: { code: 'DELI' } },
    )).toBe(true)
    expect(isExpenseInAccounting({ status: 'DRAFT' }, 'deli')).toBe(true)
  })

  it('keeps other unapproved expenses in the request workflow', () => {
    for (const status of ['DRAFT', 'PENDING_APPROVAL', 'RETURNED', 'REJECTED', 'CANCELLED'] as const) {
      expect(isExpenseInAccounting({ status, expenseType: { code: 'OFFICE' } })).toBe(false)
    }
  })
})
