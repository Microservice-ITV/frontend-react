import { describe, expect, it } from 'vitest'
import type { AccountingIncomeLine } from '@/features/admin/api/adminAccountingApi'
import { toIncomeRows } from './SellerIncomePage'

const incomeLine = (memo: string | null): AccountingIncomeLine => ({
  id: 'income-line-1',
  direction: 'CREDIT',
  amount: 125,
  memo,
  account: { code: '4000', name: 'Revenue', type: 'INCOME' },
  journalEntry: {
    referenceType: 'PAYMENT',
    referenceId: 'payment-1',
    narration: 'Collected COD payment',
    entryDate: '2026-09-29T01:16:08.152Z',
    status: 'POSTED',
  },
})

describe('seller income shop attribution', () => {
  it('shows the newest income date first', () => {
    const rows = toIncomeRows(
      [
        {
          ...incomeLine('Revenue recognized (shop=shop-a)'),
          id: 'older',
          journalEntry: {
            ...incomeLine(null).journalEntry,
            entryDate: '2026-09-28T01:16:08.152Z',
          },
        },
        {
          ...incomeLine('Revenue recognized (shop=shop-a)'),
          id: 'newer',
          journalEntry: {
            ...incomeLine(null).journalEntry,
            entryDate: '2026-10-17T01:16:08.152Z',
          },
        },
      ],
      new Set(['shop-a']),
      {},
    )

    expect(rows.map((row) => row.id)).toEqual(['newer', 'older'])
  })

  it('includes income tagged to the owner shop', () => {
    const rows = toIncomeRows(
      [incomeLine('Revenue recognized (shop=SHOP-A)')],
      new Set(['shop-a']),
      {},
    )

    expect(rows).toHaveLength(1)
    expect(rows[0].shopId).toBe('shop-a')
    expect(rows[0].reference).toBe('PAYMENT-290926-0001')
  })

  it('does not reassign income explicitly tagged to another shop', () => {
    const rows = toIncomeRows(
      [incomeLine('Revenue recognized (shop=shop-b)')],
      new Set(['shop-a']),
      {},
    )

    expect(rows).toHaveLength(0)
  })

  it('attributes legacy untagged income when the owner has one authorized shop', () => {
    const rows = toIncomeRows(
      [incomeLine(null)],
      new Set(['shop-a']),
      {},
    )

    expect(rows).toHaveLength(1)
    expect(rows[0].shopId).toBe('shop-a')
  })
})