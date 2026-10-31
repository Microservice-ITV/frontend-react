import { describe, expect, it } from 'vitest'
import {
  getDeliveryFeeTotal,
  getNetBalanceCardStyles,
  getPostedExpenseTotal,
} from './SellerAccountingOverviewPage'

describe('accounting overview posted expense total', () => {
  it('includes approved and DELI expenses while excluding other unapproved expenses', () => {
    expect(getPostedExpenseTotal([
      { amount: '100', status: 'APPROVED' },
      { amount: '200', status: 'REJECTED' },
      { amount: '300', status: 'PENDING_APPROVAL' },
      { amount: '50', status: 'PENDING_APPROVAL', expenseType: { code: 'DELI' } },
    ] as any)).toBe(150)
  })

  describe('accounting overview net balance card colors', () => {
    it('uses profit colors for a positive net balance', () => {
      expect(getNetBalanceCardStyles(100).cardTone).toContain('emerald')
    })

    it('uses loss colors for a negative net balance', () => {
      expect(getNetBalanceCardStyles(-100).cardTone).toContain('red')
      expect(getNetBalanceCardStyles(-100).valueTone).toBe('text-red-700')
    })

    it('uses neutral colors when income and expenses are equal', () => {
      expect(getNetBalanceCardStyles(0).cardTone).toContain('slate')
      expect(getNetBalanceCardStyles(0).valueTone).toBe('text-slate-900')
    })
  })

  describe('accounting overview delivery fee total', () => {
    it('totals shipping payable lines together regardless of ledger currency', () => {
      expect(getDeliveryFeeTotal([
        {
          direction: 'CREDIT',
          amount: '300',
          currency: 'MMK',
          memo: 'Delivery fee payable (MMK) (order=order-1, shop=shop-1)',
          account: { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
        },
        {
          direction: 'CREDIT',
          amount: '2',
          currency: 'USD',
          memo: 'Delivery fee payable (USD) (order=order-2, shop=shop-1)',
          account: { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
        },
        {
          direction: 'CREDIT',
          amount: '100',
          memo: 'Revenue recognized (MMK) (shop=shop-1)',
          account: { code: '4000', name: 'Sales Revenue', type: 'INCOME' },
        },
      ])).toBe(302)
    })
  })
})