import { describe, expect, it } from 'vitest'
import type { AccountingIncomeLine } from '@/features/accounting/types/accountingTypes'
import { getShopIncomeTotal } from './financeTotals'

const line = (overrides: Partial<AccountingIncomeLine> = {}): AccountingIncomeLine => ({
  id: 'line-1',
  direction: 'CREDIT',
  amount: '96.07',
  memo: null,
  account: { code: '4000', name: 'Revenue', type: 'INCOME' },
  journalEntry: {
    referenceType: 'COD_REVENUE',
    referenceId: 'revenue-1',
    narration: 'Shop revenue',
    entryDate: '2026-10-22T00:00:00.000Z',
    status: 'POSTED',
  },
  ...overrides,
})

describe('getShopIncomeTotal', () => {
  it('matches Income page shop and date filtering', () => {
    expect(getShopIncomeTotal([
      line({
        memo: 'COD sales revenue (shop=shop-a)',
        amount: 67.94,
        journalEntry: {
          ...line().journalEntry,
          entryDate: '2026-10-29T00:00:00.000Z',
        },
      }),
      line({
        id: 'outside-date',
        memo: 'COD sales revenue (shop=shop-a)',
        amount: 50,
        journalEntry: {
          ...line().journalEntry,
          entryDate: '2026-09-29T00:00:00.000Z',
        },
      }),
      line({
        id: 'other-shop',
        memo: 'COD sales revenue (shop=shop-b)',
        amount: 20,
      }),
    ], ['shop-a'], '2026-09-30', '2026-10-31')).toBeCloseTo(67.94)
  })

  it('attributes legacy entries only when the selected scope is one shop', () => {
    const entry = line({ memo: null })
    expect(
      getShopIncomeTotal([entry], ['shop-a'], '2026-10-01', '2026-10-31'),
    ).toBe(96.07)
    expect(
      getShopIncomeTotal(
        [entry],
        ['shop-a', 'shop-b'],
        '2026-10-01',
        '2026-10-31',
      ),
    ).toBe(0)
  })
})
