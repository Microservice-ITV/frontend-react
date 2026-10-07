import { describe, expect, it } from 'vitest'
import { getDeliveryFeeTotals, getPostedExpenseTotal } from './SellerAccountingOverviewPage'

describe('accounting overview posted expense total', () => {
  it('excludes rejected and pending expenses', () => {
    expect(getPostedExpenseTotal([
      { amount: '100', status: 'APPROVED' },
      { amount: '200', status: 'REJECTED' },
      { amount: '300', status: 'PENDING_APPROVAL' },
    ] as any)).toBe(100)
  })

  describe('accounting overview delivery fee total', () => {
    it('totals shipping payable lines by currency and ignores unrelated journal lines', () => {
      expect(getDeliveryFeeTotals([
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
      ])).toEqual({ MMK: 300, USD: 2 })
    })
  })
})